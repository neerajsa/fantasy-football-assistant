#!/usr/bin/env python3

import psycopg
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime
import uuid
from .custom_ranking_sources import CustomRankingDataCollector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomRankingAlgorithm:
    """Algorithm to generate custom rankings using FantasyPros data and additional sources"""
    
    def __init__(self, db_url: str = "postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_football"):
        self.db_url = db_url
        self.data_collector = CustomRankingDataCollector()
        
        # Algorithm weights
        self.fantasypros_weight = 0.60  # 60% weight to FantasyPros (our baseline)
        self.external_sources_weight = 0.40  # 40% weight to external sources
    
    def get_fantasypros_data(self) -> Dict[str, Dict]:
        """Retrieve all FantasyPros player data from database"""
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT player_name, position, team,
                   ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                   adp_standard, adp_ppr, adp_half_ppr,
                   previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr
            FROM fantasypros_players
            ORDER BY COALESCE(ecr_rank_half_ppr, ecr_rank_ppr, ecr_rank_standard, 999)
        """)
        
        fantasypros_data = {}
        for row in cur.fetchall():
            (name, pos, team, ecr_std, ecr_ppr, ecr_half, 
             adp_std, adp_ppr, adp_half, pts_std, pts_ppr, pts_half) = row
            
            player_key = f"{name}_{pos}_{team}"
            fantasypros_data[player_key] = {
                'player_name': name,
                'position': pos,
                'team': team,
                'ecr_rank_standard': ecr_std,
                'ecr_rank_ppr': ecr_ppr,
                'ecr_rank_half_ppr': ecr_half,
                'adp_standard': float(adp_std) if adp_std else None,
                'adp_ppr': float(adp_ppr) if adp_ppr else None,
                'adp_half_ppr': float(adp_half) if adp_half else None,
                'previous_year_points_standard': float(pts_std) if pts_std else None,
                'previous_year_points_ppr': float(pts_ppr) if pts_ppr else None,
                'previous_year_points_half_ppr': float(pts_half) if pts_half else None
            }
        
        conn.close()
        logger.info(f"Retrieved {len(fantasypros_data)} players from FantasyPros database")
        return fantasypros_data
    
    def calculate_custom_rankings(self, scoring_type: str) -> List[Dict]:
        """Calculate custom rankings for a specific scoring type"""
        
        # Get FantasyPros baseline data
        fantasypros_data = self.get_fantasypros_data()
        
        # Get external source rankings
        external_rankings = self.data_collector.collect_all_rankings(scoring_type)
        external_consensus = self.data_collector.aggregate_rankings(external_rankings)
        
        # Combine rankings using weighted algorithm
        custom_rankings = []
        
        for player_key, fp_data in fantasypros_data.items():
            # Get FantasyPros rank for this scoring type
            fp_rank_field = f"ecr_rank_{scoring_type}"
            fp_rank = fp_data.get(fp_rank_field)
            
            if not fp_rank:
                continue  # Skip players without FantasyPros rank
            
            # Get external consensus rank (convert score back to rank-like value)
            external_data = external_consensus.get(player_key)
            
            if external_data:
                # Convert external score to a rank-equivalent
                # Higher score = better = lower rank equivalent
                external_rank_equiv = 1.0 / external_data['score'] if external_data['score'] > 0 else 999
            else:
                # If no external data, use FantasyPros rank as fallback
                external_rank_equiv = fp_rank
            
            # Calculate weighted custom rank
            custom_rank = (
                fp_rank * self.fantasypros_weight + 
                external_rank_equiv * self.external_sources_weight
            )
            
            # Calculate custom ADP (derive from rank)
            custom_adp = self.rank_to_adp(custom_rank, fp_data['position'])
            
            custom_rankings.append({
                'player_name': fp_data['player_name'],
                'position': fp_data['position'],
                'team': fp_data['team'],
                'custom_rank': round(custom_rank, 1),
                'custom_adp': round(custom_adp, 2),
                'previous_year_points': fp_data.get(f'previous_year_points_{scoring_type}'),
                'fantasypros_rank': fp_rank,
                'external_influence': abs(fp_rank - external_rank_equiv) if external_data else 0
            })
        
        # Sort by custom rank and assign final integer ranks
        custom_rankings.sort(key=lambda x: x['custom_rank'])
        
        for i, player in enumerate(custom_rankings, 1):
            player['final_custom_rank'] = i
        
        logger.info(f"Generated {len(custom_rankings)} custom rankings for {scoring_type}")
        return custom_rankings
    
    def rank_to_adp(self, rank: float, position: str) -> float:
        """Convert a rank to an estimated Average Draft Position"""
        
        # Position adjustments (some positions go earlier/later than overall rank)
        position_adjustments = {
            'QB': 1.2,  # QBs generally go later than their rank
            'RB': 0.9,  # RBs go earlier
            'WR': 0.95, # WRs go slightly earlier
            'TE': 1.1,  # TEs go later except for elite ones
            'K': 2.0,   # Kickers go much later
            'DST': 2.0  # Defenses go much later
        }
        
        adjustment = position_adjustments.get(position, 1.0)
        adp = rank * adjustment
        
        # Add some realistic variance (ADP is usually not exactly rank)
        import random
        variance = random.uniform(0.8, 1.2)
        adp *= variance
        
        # Cap ADP at 999.99 to fit in numeric(5,2) field
        return min(999.99, max(1.0, adp))
    
    def populate_custom_rankings_database(self):
        """Populate the custom_rankings_players table with calculated data"""
        
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        # Clear existing custom rankings
        cur.execute("DELETE FROM custom_rankings_players")
        logger.info("Cleared existing custom rankings")
        
        # Generate rankings for all scoring types
        all_custom_data = {}
        
        for scoring_type in ['standard', 'ppr', 'half_ppr']:
            logger.info(f"Calculating custom rankings for {scoring_type}...")
            rankings = self.calculate_custom_rankings(scoring_type)
            
            for player in rankings:
                player_key = f"{player['player_name']}_{player['position']}_{player['team']}"
                
                if player_key not in all_custom_data:
                    all_custom_data[player_key] = {
                        'player_name': player['player_name'],
                        'position': player['position'],
                        'team': player['team'],
                        'previous_year_points_standard': None,
                        'previous_year_points_ppr': None,
                        'previous_year_points_half_ppr': None
                    }
                
                # Add scoring-specific data
                all_custom_data[player_key][f'ecr_rank_{scoring_type}'] = player['final_custom_rank']
                all_custom_data[player_key][f'adp_{scoring_type}'] = player['custom_adp']
                all_custom_data[player_key][f'previous_year_points_{scoring_type}'] = player['previous_year_points']
        
        # Insert into database
        inserted_count = 0
        
        for player_key, data in all_custom_data.items():
            cur.execute("""
                INSERT INTO custom_rankings_players (
                    id, player_name, position, team,
                    ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                    adp_standard, adp_ppr, adp_half_ppr,
                    previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr,
                    last_updated
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s
                )
            """, (
                str(uuid.uuid4()),
                data['player_name'],
                data['position'], 
                data['team'],
                data.get('ecr_rank_standard'),
                data.get('ecr_rank_ppr'),
                data.get('ecr_rank_half_ppr'),
                data.get('adp_standard'),
                data.get('adp_ppr'),
                data.get('adp_half_ppr'),
                data.get('previous_year_points_standard'),
                data.get('previous_year_points_ppr'),
                data.get('previous_year_points_half_ppr'),
                datetime.now()
            ))
            inserted_count += 1
        
        conn.commit()
        conn.close()
        
        logger.info(f"Successfully inserted {inserted_count} players into custom_rankings_players table")
    
    def show_custom_rankings_sample(self):
        """Display sample of custom rankings"""
        conn = psycopg.connect(self.db_url)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT player_name, position, team,
                   ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                   adp_standard, adp_ppr, adp_half_ppr,
                   previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr
            FROM custom_rankings_players
            ORDER BY COALESCE(ecr_rank_half_ppr, ecr_rank_ppr, ecr_rank_standard, 999)
            LIMIT 15
        """)
        
        print('\n=== CUSTOM RANKINGS SAMPLE (Top 15 Players) ===')
        print('=' * 140)
        print(f'{'Name':<22} {'Pos':<4} {'Team':<4} {'Std_R':<5} {'PPR_R':<5} {'Half_R':<6} {'Std_ADP':<7} {'PPR_ADP':<7} {'Half_ADP':<8} {'Std_Pts':<7} {'PPR_Pts':<7} {'Half_Pts':<8}')
        print('-' * 140)
        
        for row in cur.fetchall():
            name, pos, team, std_r, ppr_r, half_r, std_adp, ppr_adp, half_adp, std_pts, ppr_pts, half_pts = row
            print(f'{name:<22} {pos:<4} {team:<4} {str(std_r or ""):<5} {str(ppr_r or ""):<5} {str(half_r or ""):<6} {str(std_adp or ""):<7} {str(ppr_adp or ""):<7} {str(half_adp or ""):<8} {str(std_pts or ""):<7} {str(ppr_pts or ""):<7} {str(half_pts or ""):<8}')
        
        conn.close()
    
    def run_full_custom_ranking_generation(self):
        """Run the complete custom ranking generation process"""
        logger.info("Starting custom ranking generation...")
        
        # Generate and populate custom rankings
        self.populate_custom_rankings_database()
        
        # Show sample results
        self.show_custom_rankings_sample()
        
        logger.info("Custom ranking generation completed!")

def main():
    """Run the custom ranking algorithm"""
    algorithm = CustomRankingAlgorithm()
    algorithm.run_full_custom_ranking_generation()

if __name__ == "__main__":
    main()