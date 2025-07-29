# Database Update Scripts

This directory contains scripts for updating the fantasy football rankings databases.

## Available Scripts

### Main Update Script
**`update_rankings.py`** - Primary script for updating rankings databases

```bash
# Update custom rankings only
python -m app.scripts.update_rankings custom

# Update FantasyPros only (shows instructions)
python -m app.scripts.update_rankings fantasypros

# Update both databases
python -m app.scripts.update_rankings both
```

## Individual Data Import Scripts

Located in `app/data_import/`:

### FantasyPros Data
- **`csv_importer.py`** - Import FantasyPros data from CSV files
- **`update_database_structure.py`** - Update FantasyPros database with additional data

```bash
# Import FantasyPros CSV data
python -m app.data_import.csv_importer

# Update FantasyPros database structure/data
python -m app.data_import.update_database_structure
```

### Custom Rankings Data
- **`custom_ranking_algorithm.py`** - Generate custom rankings
- **`custom_ranking_sources.py`** - Collect data from external sources

```bash
# Generate custom rankings
python -m app.data_import.custom_ranking_algorithm
```

## Database Tables

- **`fantasypros_players`** - FantasyPros expert consensus rankings
- **`custom_rankings_players`** - Our custom calculated rankings

Both tables have identical structure with ECR ranks and ADP values for Standard, PPR, and Half-PPR scoring.

## Usage Workflow

1. **Initial Setup**: Import FantasyPros data using CSV importer
2. **Generate Custom Rankings**: Run custom ranking algorithm  
3. **Regular Updates**: Use `update_rankings.py custom` to refresh custom rankings
4. **Full Refresh**: Use `update_rankings.py both` when you have new FantasyPros data

## Requirements

- PostgreSQL database running
- Virtual environment activated
- Database connection configured in scripts