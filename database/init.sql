-- Fantasy Football Database Initialization
-- Create extensions and enums needed for the application

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for player positions
CREATE TYPE player_position AS ENUM ('QB', 'RB', 'WR', 'TE', 'K', 'DST');

-- Create enum for NFL teams
CREATE TYPE nfl_team AS ENUM (
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
);

-- Create enum for scoring types
CREATE TYPE scoring_type AS ENUM ('standard', 'ppr', 'half_ppr');

-- Set default timezone
SET timezone = 'UTC';