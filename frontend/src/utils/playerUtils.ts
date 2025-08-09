import { Player } from '../types/draft';

/**
 * Get ECR rank for a player based on scoring type
 */
export const getPlayerEcrRank = (player: Player, scoringType: string): number | undefined => {
  switch (scoringType) {
    case 'standard':
      return player.ecr_rank_standard;
    case 'ppr':
      return player.ecr_rank_ppr;
    case 'half_ppr':
      return player.ecr_rank_half_ppr;
    default:
      return player.ecr_rank_ppr;
  }
};

/**
 * Get ADP (Average Draft Position) for a player based on scoring type
 */
export const getPlayerAdp = (player: Player, scoringType: string): number | undefined => {
  switch (scoringType) {
    case 'standard':
      return player.adp_standard;
    case 'ppr':
      return player.adp_ppr;
    case 'half_ppr':
      return player.adp_half_ppr;
    default:
      return player.adp_ppr;
  }
};

/**
 * Get previous year points for a player based on scoring type
 */
export const getPlayerPreviousYearPoints = (player: Player, scoringType: string): number | undefined => {
  switch (scoringType) {
    case 'standard':
      return player.previous_year_points_standard;
    case 'ppr':
      return player.previous_year_points_ppr;
    case 'half_ppr':
      return player.previous_year_points_half_ppr;
    default:
      return player.previous_year_points_ppr;
  }
};