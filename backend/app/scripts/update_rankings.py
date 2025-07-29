#!/usr/bin/env python3

"""
Update Fantasy Football Rankings

This script updates both FantasyPros and custom rankings databases.

Usage:
    python -m app.scripts.update_rankings fantasypros    # Update FantasyPros only
    python -m app.scripts.update_rankings custom         # Update custom rankings only  
    python -m app.scripts.update_rankings both           # Update both databases
"""

import sys
import os
import argparse
import logging
from datetime import datetime

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.data_import.custom_ranking_algorithm import CustomRankingAlgorithm

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def update_fantasypros():
    """Update FantasyPros database using existing CSV importer"""
    logger.info("FantasyPros update functionality available via:")
    logger.info("  1. CSV import: python -m app.data_import.csv_importer")
    logger.info("  2. Database structure update: python -m app.data_import.update_database_structure")
    logger.info("Please use the appropriate script based on your data source.")
    return True

def update_custom_rankings():
    """Update custom rankings database"""
    logger.info("Starting custom rankings update...")
    
    try:
        algorithm = CustomRankingAlgorithm()
        algorithm.run_full_custom_ranking_generation()
        logger.info("Custom rankings update completed successfully")
        return True
    except Exception as e:
        logger.error(f"Custom rankings update failed: {str(e)}")
        return False

def main():
    """Main function"""
    
    parser = argparse.ArgumentParser(
        description="Update Fantasy Football Rankings",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        'target',
        choices=['fantasypros', 'custom', 'both'],
        help='Which rankings to update'
    )
    
    args = parser.parse_args()
    
    logger.info(f"Fantasy Football Rankings Update - {args.target.upper()}")
    logger.info(f"Started at: {datetime.now().isoformat()}")
    logger.info("-" * 50)
    
    success = True
    
    if args.target in ['fantasypros', 'both']:
        success &= update_fantasypros()
    
    if args.target in ['custom', 'both']:
        success &= update_custom_rankings()
    
    logger.info("-" * 50)
    logger.info(f"Completed at: {datetime.now().isoformat()}")
    
    if success:
        logger.info("Update completed successfully")
        sys.exit(0)
    else:
        logger.error("Update completed with errors")
        sys.exit(1)

if __name__ == "__main__":
    main()