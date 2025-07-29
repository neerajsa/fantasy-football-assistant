#!/usr/bin/env python3

import requests
from typing import Dict, List, Optional, Tuple
import logging
import time
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PlayerRanking:
    """Data structure for player ranking from external source"""
    player_name: str
    position: str
    team: str
    rank: int
    source: str
    scoring_type: str  # 'standard', 'ppr', 'half_ppr'

class CustomRankingDataCollector:
    """Collect player rankings from various internet sources"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def get_espn_rankings(self, scoring_type: str = 'ppr') -> List[PlayerRanking]:
        """Fetch rankings from ESPN (public data only)"""
        rankings = []
        
        try:
            # ESPN fantasy has public rankings available
            espn_scoring_map = {
                'standard': '0',
                'ppr': '1', 
                'half_ppr': '2'
            }
            
            scoring_param = espn_scoring_map.get(scoring_type, '1')
            
            # Note: This is a simplified example - ESPN's API structure may vary
            url = f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/0"
            
            logger.info(f"Attempting to fetch ESPN {scoring_type} rankings...")
            
            # For demo purposes, return mock data
            # In production, you'd implement the actual ESPN API calls
            mock_espn_data = [
                ("Josh Allen", "QB", "BUF", 1),
                ("Christian McCaffrey", "RB", "SF", 2), 
                ("Tyreek Hill", "WR", "MIA", 3),
                ("Travis Kelce", "TE", "KC", 4),
                ("Saquon Barkley", "RB", "PHI", 5)
            ]
            
            for name, pos, team, rank in mock_espn_data:
                rankings.append(PlayerRanking(
                    player_name=name,
                    position=pos,
                    team=team,
                    rank=rank,
                    source="ESPN",
                    scoring_type=scoring_type
                ))
            
            logger.info(f"Retrieved {len(rankings)} ESPN rankings for {scoring_type}")
            
        except Exception as e:
            logger.error(f"Error fetching ESPN rankings: {str(e)}")
        
        return rankings
    
    def get_yahoo_rankings(self, scoring_type: str = 'ppr') -> List[PlayerRanking]:
        """Fetch rankings from Yahoo Fantasy (public data only)"""
        rankings = []
        
        try:
            logger.info(f"Attempting to fetch Yahoo {scoring_type} rankings...")
            
            # Yahoo also has public rankings - this is a simplified example
            # In production, you'd implement actual Yahoo API calls
            mock_yahoo_data = [
                ("Josh Allen", "QB", "BUF", 2),
                ("Christian McCaffrey", "RB", "SF", 1),
                ("Tyreek Hill", "WR", "MIA", 4),
                ("Travis Kelce", "TE", "KC", 3),
                ("Saquon Barkley", "RB", "PHI", 6)
            ]
            
            for name, pos, team, rank in mock_yahoo_data:
                rankings.append(PlayerRanking(
                    player_name=name,
                    position=pos,
                    team=team,
                    rank=rank,
                    source="Yahoo",
                    scoring_type=scoring_type
                ))
            
            logger.info(f"Retrieved {len(rankings)} Yahoo rankings for {scoring_type}")
            
        except Exception as e:
            logger.error(f"Error fetching Yahoo rankings: {str(e)}")
        
        return rankings
    
    def get_sleeper_rankings(self, scoring_type: str = 'ppr') -> List[PlayerRanking]:
        """Fetch rankings from Sleeper (uses public API)"""
        rankings = []
        
        try:
            logger.info(f"Attempting to fetch Sleeper {scoring_type} rankings...")
            
            # Sleeper has a public API for player data
            # This is simplified - actual implementation would use their endpoints
            mock_sleeper_data = [
                ("Josh Allen", "QB", "BUF", 1),
                ("Christian McCaffrey", "RB", "SF", 3),
                ("Tyreek Hill", "WR", "MIA", 2),
                ("Travis Kelce", "TE", "KC", 5),
                ("Saquon Barkley", "RB", "PHI", 4)
            ]
            
            for name, pos, team, rank in mock_sleeper_data:
                rankings.append(PlayerRanking(
                    player_name=name,
                    position=pos,
                    team=team,
                    rank=rank,
                    source="Sleeper",
                    scoring_type=scoring_type
                ))
            
            logger.info(f"Retrieved {len(rankings)} Sleeper rankings for {scoring_type}")
            
        except Exception as e:
            logger.error(f"Error fetching Sleeper rankings: {str(e)}")
        
        return rankings
    
    def get_reddit_consensus(self, scoring_type: str = 'ppr') -> List[PlayerRanking]:
        """Fetch community consensus from Reddit fantasy football communities"""
        rankings = []
        
        try:
            logger.info(f"Attempting to fetch Reddit consensus for {scoring_type}...")
            
            # This would involve scraping Reddit posts/comments for community rankings
            # For demo purposes, using mock data
            mock_reddit_data = [
                ("Josh Allen", "QB", "BUF", 1),
                ("Christian McCaffrey", "RB", "SF", 2),
                ("Tyreek Hill", "WR", "MIA", 5),
                ("Travis Kelce", "TE", "KC", 4),
                ("Saquon Barkley", "RB", "PHI", 3)
            ]
            
            for name, pos, team, rank in mock_reddit_data:
                rankings.append(PlayerRanking(
                    player_name=name,
                    position=pos,
                    team=team,
                    rank=rank,
                    source="Reddit",
                    scoring_type=scoring_type
                ))
            
            logger.info(f"Retrieved {len(rankings)} Reddit consensus rankings for {scoring_type}")
            
        except Exception as e:
            logger.error(f"Error fetching Reddit consensus: {str(e)}")
        
        return rankings
    
    def collect_all_rankings(self, scoring_type: str = 'ppr') -> Dict[str, List[PlayerRanking]]:
        """Collect rankings from all available sources"""
        all_rankings = {}
        
        sources = [
            ('ESPN', self.get_espn_rankings),
            ('Yahoo', self.get_yahoo_rankings), 
            ('Sleeper', self.get_sleeper_rankings),
            ('Reddit', self.get_reddit_consensus)
        ]
        
        for source_name, source_func in sources:
            try:
                rankings = source_func(scoring_type)
                all_rankings[source_name] = rankings
                time.sleep(1)  # Be respectful to APIs
            except Exception as e:
                logger.error(f"Error collecting {source_name} rankings: {str(e)}")
                all_rankings[source_name] = []
        
        return all_rankings
    
    def aggregate_rankings(self, all_rankings: Dict[str, List[PlayerRanking]]) -> Dict[str, float]:
        """Aggregate rankings from multiple sources into consensus rankings"""
        player_scores = {}
        
        # Weight different sources
        source_weights = {
            'ESPN': 0.25,
            'Yahoo': 0.25,
            'Sleeper': 0.25,
            'Reddit': 0.25
        }
        
        for source, rankings in all_rankings.items():
            weight = source_weights.get(source, 0.25)
            
            for ranking in rankings:
                player_key = f"{ranking.player_name}_{ranking.position}_{ranking.team}"
                
                if player_key not in player_scores:
                    player_scores[player_key] = {
                        'weighted_score': 0.0,
                        'total_weight': 0.0,
                        'player_name': ranking.player_name,
                        'position': ranking.position,
                        'team': ranking.team
                    }
                
                # Lower rank = better, so we invert the score
                # Use 1/rank as the score, weighted by source importance
                score = (1.0 / ranking.rank) * weight
                player_scores[player_key]['weighted_score'] += score
                player_scores[player_key]['total_weight'] += weight
        
        # Calculate final consensus scores
        consensus_rankings = {}
        for player_key, data in player_scores.items():
            if data['total_weight'] > 0:
                final_score = data['weighted_score'] / data['total_weight']
                consensus_rankings[player_key] = {
                    'score': final_score,
                    'player_name': data['player_name'],
                    'position': data['position'],
                    'team': data['team']
                }
        
        return consensus_rankings

def main():
    """Test the data collection functionality"""
    collector = CustomRankingDataCollector()
    
    for scoring_type in ['standard', 'ppr', 'half_ppr']:
        logger.info(f"\n=== Collecting {scoring_type} rankings ===")
        
        all_rankings = collector.collect_all_rankings(scoring_type)
        consensus = collector.aggregate_rankings(all_rankings)
        
        # Sort by score (higher is better)
        sorted_consensus = sorted(
            consensus.items(), 
            key=lambda x: x[1]['score'], 
            reverse=True
        )
        
        print(f"\nTop 10 {scoring_type} consensus rankings:")
        for i, (player_key, data) in enumerate(sorted_consensus[:10], 1):
            print(f"{i:2d}. {data['player_name']} ({data['position']}, {data['team']}) - Score: {data['score']:.4f}")

if __name__ == "__main__":
    main()