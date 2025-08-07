export enum DraftStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export enum DraftType {
  SNAKE = 'snake',
  LINEAR = 'linear'
}

export enum ScoringType {
  STANDARD = 'standard',
  PPR = 'ppr',
  HALF_PPR = 'half_ppr'
}

export interface DraftTeam {
  id: string;
  draft_session_id: string;
  team_index: number;
  team_name: string;
  is_user: boolean;
  current_roster: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface DraftPick {
  id: string;
  draft_session_id: string;
  team_id: string;
  player_id?: string;
  round_number: number;
  pick_number: number;
  team_pick_number: number;
  picked_at?: string;
  pick_time_seconds?: number;
  created_at: string;
  updated_at: string;
  // Additional fields from API
  player?: Player;
  team?: DraftTeam;
}

export interface DraftSession {
  id: string;
  num_teams: number;
  draft_type: DraftType;
  scoring_type: ScoringType;
  roster_positions: Record<string, number>;
  status: DraftStatus;
  current_round: number;
  current_pick: number;
  current_team_index: number;
  total_rounds: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  teams?: DraftTeam[];
  picks?: DraftPick[];
}

export interface Player {
  id: string;
  player_name: string;
  position: string;
  team: string;
  ecr_rank_ppr?: number;
  ecr_rank_standard?: number;
  ecr_rank_half_ppr?: number;
  adp_ppr?: number;
  adp_standard?: number;
  adp_half_ppr?: number;
  previous_year_points_ppr?: number;
  previous_year_points_standard?: number;
  previous_year_points_half_ppr?: number;
}

export interface DraftStateResponse {
  draft_session: DraftSession;
  current_team: DraftTeam;
  available_players: Player[];
  recent_picks: DraftPick[];
}

export interface MakePickRequest {
  player_id: string;
  player_name: string;
}

export interface DraftBoardProps {
  draftId: string;
}

export interface DraftTeamCreate {
  team_index: number;
  team_name: string;
  is_user: boolean;
}

export interface DraftSessionCreate {
  num_teams: number;
  draft_type: DraftType;
  scoring_type: ScoringType;
  roster_positions: Record<string, number>;
  teams: DraftTeamCreate[];
}

// UI-specific types
export interface DraftBoardCell {
  round: number;
  team_index: number;
  pick_number: number;
  pick?: DraftPick;
  is_current: boolean;
  is_user_team: boolean;
}

export interface PlayerSearchFilters {
  position?: string;
  search_text?: string;
  min_rank?: number;
  max_rank?: number;
}

export interface DraftOrderData {
  draft_order: number[][];
  team_names: string[];
  current_round: number;
  current_pick: number;
  current_team_index: number;
  total_rounds: number;
  draft_type: string;
  is_complete: boolean;
}