#!/usr/bin/env python3

import csv
import psycopg
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseStructureUpdater:
    """
    Update the FantasyPros database structure by:
    1. Removing unnecessary columns
    2. Adding ADP data from ranking CSV files
    3. Adding previous year fantasy points from stats CSV files
    """
    
    def __init__(self, db_url: str = "postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_football"):
        self.db_url = db_url
    
    def clean_numeric_value(self, value: str) -> Optional[float]:
        """Clean and convert numeric values"""
        if not value or value == '':
            return None
        
        cleaned = str(value).strip('"').strip()
        if cleaned == '' or cleaned == '-':
            return None
        
        cleaned = cleaned.replace('+', '').replace(',', '')
        
        try:
            return float(cleaned)
        except ValueError:
            return None
    
    def parse_ranking_csv_for_adp(self, file_path: str) -> Dict[str, float]:
        """Parse ranking CSV to extract ADP data from AVG. column"""
        adp_data = {}
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                player_name = row.get('PLAYER NAME', '').strip('"')
                avg_value = self.clean_numeric_value(row.get('AVG.', ''))
                
                if player_name and avg_value is not None:
                    adp_data[player_name] = avg_value
        
        logger.info(f"Parsed {len(adp_data)} ADP records from {file_path}")
        return adp_data
    
    def parse_stats_csv_for_points(self, file_path: str) -> Dict[str, float]:
        """Parse stats CSV to extract fantasy points from FANTASYPTS column"""
        points_data = {}
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                player_name = row.get('PLAYER NAME', '').strip('"')
                fantasy_pts = self.clean_numeric_value(row.get('FANTASYPTS', ''))
                
                if player_name and fantasy_pts is not None:
                    points_data[player_name] = fantasy_pts
        
        logger.info(f"Parsed {len(points_data)} fantasy points records from {file_path}")
        return points_data
    
    def drop_unnecessary_columns(self):
        """Drop the columns that are no longer needed"""
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        columns_to_drop = [
            'player_id',
            'fantasypros_id', 
            'projected_points_standard',
            'projected_points_ppr',
            'projected_points_half_ppr',
            'expert_count',
            'position_rank',
            'data_source_url',
            'notes',
            'created_at',
            'updated_at'
        ]
        
        logger.info("Dropping unnecessary columns...")
        
        for column in columns_to_drop:
            try:
                cur.execute(f'ALTER TABLE fantasypros_players DROP COLUMN IF EXISTS {column}')
                logger.info(f"Dropped column: {column}")
            except Exception as e:
                logger.warning(f"Could not drop column {column}: {str(e)}")
        
        conn.commit()
        conn.close()
        logger.info("Column cleanup completed")
    
    def update_adp_and_points_data(self, 
                                  standard_ranks_file: str,
                                  half_ppr_ranks_file: str, 
                                  ppr_ranks_file: str,
                                  standard_stats_file: str,
                                  half_ppr_stats_file: str,
                                  ppr_stats_file: str):
        """Update the database with ADP and previous year points data"""
        
        # Parse all the CSV files
        logger.info("Parsing CSV files for additional data...")
        
        # ADP data from ranking files
        standard_adp = self.parse_ranking_csv_for_adp(standard_ranks_file)
        half_ppr_adp = self.parse_ranking_csv_for_adp(half_ppr_ranks_file)
        ppr_adp = self.parse_ranking_csv_for_adp(ppr_ranks_file)
        
        # Fantasy points data from stats files
        standard_points = self.parse_stats_csv_for_points(standard_stats_file)
        half_ppr_points = self.parse_stats_csv_for_points(half_ppr_stats_file)
        ppr_points = self.parse_stats_csv_for_points(ppr_stats_file)
        
        # Update database
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        # Get all players from database
        cur.execute("SELECT id, player_name FROM fantasypros_players")
        players = cur.fetchall()
        
        updated_count = 0
        
        for player_id, player_name in players:
            # Prepare update data
            updates = []
            values = []
            
            # ADP data
            if player_name in standard_adp:
                updates.append("adp_standard = %s")
                values.append(standard_adp[player_name])
            
            if player_name in half_ppr_adp:
                updates.append("adp_half_ppr = %s")
                values.append(half_ppr_adp[player_name])
            
            if player_name in ppr_adp:
                updates.append("adp_ppr = %s")
                values.append(ppr_adp[player_name])
            
            # Previous year fantasy points
            if player_name in standard_points:
                updates.append("previous_year_points_standard = %s")
                values.append(standard_points[player_name])
            
            if player_name in half_ppr_points:
                updates.append("previous_year_points_half_ppr = %s")
                values.append(half_ppr_points[player_name])
            
            if player_name in ppr_points:
                updates.append("previous_year_points_ppr = %s")
                values.append(ppr_points[player_name])
            
            # Execute update if we have data
            if updates:
                values.append(player_id)  # Add player_id for WHERE clause
                update_sql = f"""
                    UPDATE fantasypros_players 
                    SET {', '.join(updates)}
                    WHERE id = %s
                """
                
                cur.execute(update_sql, values)
                updated_count += 1
        
        conn.commit()
        conn.close()
        
        logger.info(f"Updated {updated_count} players with additional ADP and fantasy points data")
    
    def show_updated_structure(self):
        """Display the updated table structure and sample data"""
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        # Show table structure
        cur.execute('''
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'fantasypros_players' AND table_schema = 'public'
            ORDER BY ordinal_position;
        ''')
        
        print('=== UPDATED TABLE STRUCTURE ===')
        print('=' * 60)
        columns = cur.fetchall()
        for col_name, data_type, nullable in columns:
            null_str = 'NULL' if nullable == 'YES' else 'NOT NULL'
            print(f'{col_name:<35} {data_type:<20} {null_str}')
        
        # Show sample data
        print(f'\n=== SAMPLE DATA (Top 10 Players) ===')
        print('=' * 120)
        
        cur.execute('''
            SELECT player_name, position, team,
                   ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                   adp_standard, adp_ppr, adp_half_ppr,
                   previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr
            FROM fantasypros_players 
            ORDER BY COALESCE(ecr_rank_half_ppr, ecr_rank_ppr, ecr_rank_standard, 999)
            LIMIT 10;
        ''')
        
        print(f'{'Name':<20} {'Pos':<4} {'Team':<4} {'Std_R':<5} {'PPR_R':<5} {'Half_R':<6} {'Std_ADP':<7} {'PPR_ADP':<7} {'Half_ADP':<8} {'Std_Pts':<7} {'PPR_Pts':<7} {'Half_Pts':<8}')
        print('-' * 120)
        
        for row in cur.fetchall():
            name, pos, team, std_r, ppr_r, half_r, std_adp, ppr_adp, half_adp, std_pts, ppr_pts, half_pts = row
            print(f'{name:<20} {pos:<4} {team:<4} {str(std_r or ''):<5} {str(ppr_r or ''):<5} {str(half_r or ''):<6} {str(std_adp or ''):<7} {str(ppr_adp or ''):<7} {str(half_adp or ''):<8} {str(std_pts or ''):<7} {str(ppr_pts or ''):<7} {str(half_pts or ''):<8}')
        
        conn.close()
    
    def run_full_update(self,
                       standard_ranks_file: str,
                       half_ppr_ranks_file: str, 
                       ppr_ranks_file: str,
                       standard_stats_file: str,
                       half_ppr_stats_file: str,
                       ppr_stats_file: str):
        """Run the complete database structure update"""
        
        logger.info("Starting database structure update...")
        
        # Step 1: Drop unnecessary columns
        self.drop_unnecessary_columns()
        
        # Step 2: Update with ADP and fantasy points data
        self.update_adp_and_points_data(
            standard_ranks_file, half_ppr_ranks_file, ppr_ranks_file,
            standard_stats_file, half_ppr_stats_file, ppr_stats_file
        )
        
        # Step 3: Show results
        self.show_updated_structure()
        
        logger.info("Database structure update completed successfully!")

def main():
    """Run the database structure update"""
    updater = DatabaseStructureUpdater()
    
    # File paths
    standard_ranks_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Ranks_Standard.csv"
    half_ppr_ranks_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Ranks_HalfPPR.csv"
    ppr_ranks_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Ranks_PPR.csv"
    standard_stats_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Stats_Standard.csv"
    half_ppr_stats_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Stats_HalfPPR.csv"
    ppr_stats_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Stats_PPR.csv"
    
    # Run the update
    updater.run_full_update(
        standard_ranks_file, half_ppr_ranks_file, ppr_ranks_file,
        standard_stats_file, half_ppr_stats_file, ppr_stats_file
    )

if __name__ == "__main__":
    main()