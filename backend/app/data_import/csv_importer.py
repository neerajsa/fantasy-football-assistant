import csv
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import psycopg
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FantasyProsCSVImporter:
    """
    Import FantasyPros data from CSV files into the database
    
    This handles the actual FantasyPros CSV exports for 2025 draft data
    across all three scoring types: Standard, Half-PPR, and PPR
    """
    
    def __init__(self, db_url: str = "postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_football"):
        self.db_url = db_url
        self.position_mapping = {
            # Extract position from strings like "WR1", "RB2", etc.
            'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'TE': 'TE', 'K': 'K', 'DST': 'DST'
        }
    
    def extract_position(self, pos_string: str) -> str:
        """Extract base position from strings like 'WR1', 'RB2', etc."""
        if not pos_string:
            return 'UNKNOWN'
        
        for pos in self.position_mapping.keys():
            if pos_string.startswith(pos):
                return pos
        return 'UNKNOWN'
    
    def extract_position_rank(self, pos_string: str) -> Optional[int]:
        """Extract position rank from strings like 'WR1', 'RB2', etc."""
        if not pos_string:
            return None
        
        # Extract number from end of string
        rank_str = ''.join(filter(str.isdigit, pos_string))
        return int(rank_str) if rank_str else None
    
    def clean_numeric_value(self, value: str) -> Optional[float]:
        """Clean and convert numeric values, handling special characters"""
        if not value or value == '':
            return None
        
        # Remove quotes and clean
        cleaned = str(value).strip('"').strip()
        if cleaned == '' or cleaned == '-':
            return None
        
        # Handle special characters like '+' in ECR vs ADP
        cleaned = cleaned.replace('+', '').replace(',', '')
        
        try:
            return float(cleaned)
        except ValueError:
            return None
    
    def parse_ppr_stats_csv(self, file_path: str) -> List[Dict]:
        """Parse the PPR stats CSV file (with fantasy points and stats)"""
        players = []
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Extract position from player name or other logic
                player_name = row.get('PLAYER NAME', '').strip('"')
                team = row.get('TEAM', '').strip('"')
                rank = self.clean_numeric_value(row.get('RK', ''))
                tier = self.clean_numeric_value(row.get('TIERS', ''))
                fantasy_pts = self.clean_numeric_value(row.get('FANTASYPTS', ''))
                
                # Since this CSV doesn't have explicit position, we'll infer it
                # from the context or set it later when we match with ranking files
                players.append({
                    'rank': int(rank) if rank else None,
                    'player_name': player_name,
                    'team': team,
                    'tier': int(tier) if tier else None,
                    'projected_points_ppr': fantasy_pts,
                    'position': None  # Will be set from ranking files
                })
        
        logger.info(f"Parsed {len(players)} players from PPR stats CSV")
        return players
    
    def parse_ranking_csv(self, file_path: str, scoring_type: str) -> List[Dict]:
        """Parse ranking CSV files (Standard or Half-PPR)"""
        players = []
        
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                player_name = row.get('PLAYER NAME', '').strip('"')
                team = row.get('TEAM', '').strip('"')
                pos_string = row.get('POS', '').strip('"')
                rank = self.clean_numeric_value(row.get('RK', ''))
                tier = self.clean_numeric_value(row.get('TIERS', ''))
                avg_rank = self.clean_numeric_value(row.get('AVG.', ''))
                best_rank = self.clean_numeric_value(row.get('BEST', ''))
                worst_rank = self.clean_numeric_value(row.get('WORST', ''))
                std_dev = self.clean_numeric_value(row.get('STD.DEV', ''))
                
                position = self.extract_position(pos_string)
                position_rank = self.extract_position_rank(pos_string)
                
                players.append({
                    'rank': int(rank) if rank else None,
                    'player_name': player_name,
                    'team': team,
                    'position': position,
                    'position_rank': position_rank,
                    'tier': int(tier) if tier else None,
                    'avg_expert_rank': avg_rank,
                    'best_rank': int(best_rank) if best_rank else None,
                    'worst_rank': int(worst_rank) if worst_rank else None,
                    'std_dev': std_dev,
                    'scoring_type': scoring_type
                })
        
        logger.info(f"Parsed {len(players)} players from {scoring_type} ranking CSV")
        return players
    
    def clear_existing_data(self):
        """Clear existing FantasyPros data from database"""
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        logger.info("Clearing existing FantasyPros data...")
        cur.execute("DELETE FROM fantasypros_players")
        conn.commit()
        conn.close()
        logger.info("Existing data cleared")
    
    def import_data(self, 
                   ppr_stats_file: str,
                   half_ppr_ranks_file: str, 
                   standard_ranks_file: str):
        """
        Import all CSV data into the database
        """
        logger.info("Starting FantasyPros CSV import...")
        
        # Parse all CSV files
        ppr_stats = self.parse_ppr_stats_csv(ppr_stats_file)
        half_ppr_ranks = self.parse_ranking_csv(half_ppr_ranks_file, 'half_ppr')
        standard_ranks = self.parse_ranking_csv(standard_ranks_file, 'standard')
        
        # Create player lookup by name for merging data
        ppr_lookup = {p['player_name']: p for p in ppr_stats}
        half_ppr_lookup = {p['player_name']: p for p in half_ppr_ranks}
        standard_lookup = {p['player_name']: p for p in standard_ranks}
        
        # Get all unique players
        all_player_names = set()
        all_player_names.update(ppr_lookup.keys())
        all_player_names.update(half_ppr_lookup.keys())
        all_player_names.update(standard_lookup.keys())
        
        logger.info(f"Found {len(all_player_names)} unique players across all files")
        
        # Clear existing data
        self.clear_existing_data()
        
        # Connect to database
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        imported_count = 0
        
        for player_name in all_player_names:
            try:
                # Get data from each source
                ppr_data = ppr_lookup.get(player_name, {})
                half_ppr_data = half_ppr_lookup.get(player_name, {})
                standard_data = standard_lookup.get(player_name, {})
                
                # Determine position and team (prefer ranking files as they have explicit position)
                position = (half_ppr_data.get('position') or 
                           standard_data.get('position') or 
                           'UNKNOWN')
                
                team = (half_ppr_data.get('team') or 
                       standard_data.get('team') or 
                       ppr_data.get('team') or 
                       'UNK')
                
                if position == 'UNKNOWN':
                    logger.warning(f"Could not determine position for {player_name}, skipping")
                    continue
                
                # Position rank (use half_ppr as primary, fallback to standard)
                position_rank = (half_ppr_data.get('position_rank') or 
                               standard_data.get('position_rank'))
                
                # Insert player into database
                player_id = str(uuid.uuid4())
                
                cur.execute("""
                    INSERT INTO fantasypros_players 
                    (id, player_name, position, team, position_rank,
                     ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                     projected_points_ppr,
                     last_updated, data_source_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    player_id,
                    player_name,
                    position,
                    team,
                    position_rank,
                    standard_data.get('rank'),  # Standard ECR rank
                    ppr_data.get('rank'),       # PPR ECR rank (from stats file)
                    half_ppr_data.get('rank'),  # Half-PPR ECR rank
                    ppr_data.get('projected_points_ppr'),  # PPR projected points
                    datetime.now(),
                    "FantasyPros 2025 Draft Rankings CSV Export"
                ))
                
                imported_count += 1
                
            except Exception as e:
                logger.error(f"Error importing player {player_name}: {str(e)}")
                continue
        
        conn.commit()
        conn.close()
        
        logger.info(f"Successfully imported {imported_count} players into FantasyPros table")
        return imported_count

def main():
    """Run the CSV importer"""
    importer = FantasyProsCSVImporter()
    
    # File paths
    ppr_stats_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Stats_PPR.csv"
    half_ppr_ranks_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Ranks_HalfPPR.csv"
    standard_ranks_file = "/Users/neerajsathe/Downloads/FantasyPros_2025_Draft_ALL_Rankings_Ranks_Standard.csv"
    
    # Verify files exist
    for file_path in [ppr_stats_file, half_ppr_ranks_file, standard_ranks_file]:
        if not Path(file_path).exists():
            logger.error(f"File not found: {file_path}")
            return
    
    # Import data
    importer.import_data(ppr_stats_file, half_ppr_ranks_file, standard_ranks_file)

if __name__ == "__main__":
    main()