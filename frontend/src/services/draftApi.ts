import { 
  DraftSession, 
  DraftSessionCreate, 
  DraftStateResponse, 
  MakePickRequest, 
  DraftPick,
  Player,
  PlayerSearchFilters
} from '../types/draft';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class DraftApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Draft session management
  async createDraftSession(draftData: DraftSessionCreate): Promise<DraftSession> {
    return this.request<DraftSession>('/api/draft/', {
      method: 'POST',
      body: JSON.stringify(draftData),
    });
  }

  async getDraftSession(draftId: string): Promise<DraftSession> {
    return this.request<DraftSession>(`/api/draft/${draftId}`);
  }

  async listDraftSessions(limit: number = 50): Promise<DraftSession[]> {
    return this.request<DraftSession[]>(`/api/draft/?limit=${limit}`);
  }

  async startDraftSession(draftId: string): Promise<DraftSession> {
    return this.request<DraftSession>(`/api/draft/${draftId}/start`, {
      method: 'POST',
    });
  }

  async deleteDraftSession(draftId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/draft/${draftId}`, {
      method: 'DELETE',
    });
  }

  // Draft state and gameplay
  async getDraftState(draftId: string): Promise<DraftStateResponse> {
    return this.request<DraftStateResponse>(`/api/draft/${draftId}/state`);
  }

  async makePickForTeam(
    draftId: string, 
    teamId: string, 
    pickRequest: MakePickRequest
  ): Promise<DraftPick> {
    return this.request<DraftPick>(`/api/draft/${draftId}/teams/${teamId}/pick`, {
      method: 'POST',
      body: JSON.stringify(pickRequest),
    });
  }

  async getPlayerFromPick(
    draftId: string,
    pick: DraftPick
  ): Promise<Player> {
    return this.request<Player>(`/api/draft/${draftId}/player/${pick.player_id}`);
  }

  async makeAIPick(draftId: string): Promise<DraftPick> {
    return this.request<DraftPick>(`/api/draft/${draftId}/ai-pick`, {
      method: 'POST',
    });
  }

  async getAvailablePlayers(
    draftId: string, 
    filters: PlayerSearchFilters = {},
    limit: number = 100
  ): Promise<{
    players: Player[];
    total: number;
    position_filter?: string;
  }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    if (filters.position) {
      params.append('position', filters.position);
    }
    
    return this.request<{
      players: Player[];
      total: number;
      position_filter?: string;
    }>(`/api/draft/${draftId}/available-players?${params.toString()}`);
  }

  async getRecentPicks(draftId: string, limit: number = 10): Promise<DraftPick[]> {
    return this.request<DraftPick[]>(`/api/draft/${draftId}/recent-picks?limit=${limit}`);
  }

  // Validation and reporting
  async getDraftValidationReport(draftId: string): Promise<any> {
    return this.request<any>(`/api/draft/${draftId}/validation`);
  }

  // Utility methods for filtering players
  filterPlayers(players: Player[], filters: PlayerSearchFilters): Player[] {
    let filtered = [...players];

    if (filters.search_text) {
      const searchLower = filters.search_text.toLowerCase();
      filtered = filtered.filter(player => 
        player.player_name.toLowerCase().includes(searchLower) ||
        player.team.toLowerCase().includes(searchLower)
      );
    }

    if (filters.position) {
      filtered = filtered.filter(player => 
        player.position === filters.position
      );
    }

    if (filters.min_rank !== undefined) {
      filtered = filtered.filter(player => 
        player.ecr_rank_ppr && player.ecr_rank_ppr >= filters.min_rank!
      );
    }

    if (filters.max_rank !== undefined) {
      filtered = filtered.filter(player => 
        player.ecr_rank_ppr && player.ecr_rank_ppr <= filters.max_rank!
      );
    }

    return filtered;
  }

  // Sort players by various criteria
  sortPlayers(players: Player[], sortBy: 'rank' | 'adp' | 'name' | 'position', ascending: boolean = true, scoringType: string = 'ppr'): Player[] {
    const sorted = [...players].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'rank':
          aVal = this.getPlayerEcrRank(a, scoringType) || 999;
          bVal = this.getPlayerEcrRank(b, scoringType) || 999;
          break;
        case 'adp':
          aVal = this.getPlayerAdp(a, scoringType) || 999;
          bVal = this.getPlayerAdp(b, scoringType) || 999;
          break;
        case 'name':
          aVal = a.player_name;
          bVal = b.player_name;
          break;
        case 'position':
          aVal = a.position;
          bVal = b.position;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return ascending ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }

  // Helper functions to get scoring-specific player data
  private getPlayerEcrRank(player: Player, scoringType: string): number | undefined {
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
  }

  private getPlayerAdp(player: Player, scoringType: string): number | undefined {
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
  }
}

// Export singleton instance
export const draftApi = new DraftApiService();
export default draftApi;