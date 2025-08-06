import { ScoringType, DraftType } from './draft';

export { ScoringType, DraftType };

export interface RosterPositions {
  qb: number;
  rb: number;
  wr: number;
  te: number;
  flex: number;
  superflex: number;
  k: number;
  dst: number;
  bench: number;
}

export interface DraftConfigurationCreate {
  scoring_type: ScoringType;
  draft_type: DraftType;
  draft_position?: number | null;
  num_teams: number;
  roster_positions: RosterPositions;
}

export interface DraftConfiguration extends DraftConfigurationCreate {
  id: string;
  created_at: string;
  draft_position: number;
}

export interface DraftConfigurationResponse {
  success: boolean;
  data?: DraftConfiguration;
  message: string;
}