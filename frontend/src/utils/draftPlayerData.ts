import { useState, useEffect } from 'react';
import { Player, DraftStateResponse, DraftPick } from '../types/draft';
import { draftApi } from '../services/draftApi';

/**
 * Custom hook for managing draft player data
 * This is used by both DraftBoard and YourTeam components
 */
export const useDraftPlayerData = (
  draftId: string,
  draftState: DraftStateResponse | null
) => {
  const [playersData, setPlayersData] = useState<Record<string, Player>>({});

  useEffect(() => {
    if (!draftState?.draft_session.picks) return;

    const fetchPlayerData = async () => {
      // Use functional state update to get current playersData
      setPlayersData(currentPlayersData => {
        const picksNeedingPlayerData = draftState.draft_session.picks?.filter(
          pick => pick.player_id && !currentPlayersData[pick.player_id]
        ) || [];

        console.log('useDraftPlayerData Debug:', {
          draftId,
          totalPicks: draftState.draft_session.picks?.length || 0,
          picksWithPlayerIds: draftState.draft_session.picks?.filter(p => p.player_id)?.length || 0,
          currentPlayersData: Object.keys(currentPlayersData).length,
          picksNeedingData: picksNeedingPlayerData.length,
          picksNeedingDataDetails: picksNeedingPlayerData.map(p => ({
            id: p.id,
            player_id: p.player_id,
            pick_number: p.pick_number,
            team_id: p.team_id,
            picked_at: p.picked_at
          }))
        });

        if (picksNeedingPlayerData.length === 0) {
          console.log('No picks need player data, returning current state');
          return currentPlayersData;
        }

        // Fetch player data for all picks that need it
        const playerPromises = picksNeedingPlayerData.map(pick =>
          draftApi.getPlayerFromPick(draftId, pick)
            .then(player => {
              console.log(`Fetched player data for pick ${pick.id}:`, player);
              return { pickId: pick.id, playerId: pick.player_id!, player };
            })
            .catch(err => {
              console.error(`Failed to fetch player data for pick ${pick.id}:`, err);
              return null;
            })
        );

        // Execute async fetch and update state when done
        Promise.all(playerPromises)
          .then(playerResults => {
            const newPlayersData = { ...currentPlayersData };
            playerResults.forEach(result => {
              if (result) {
                newPlayersData[result.playerId] = result.player;
                console.log(`Added player ${result.player.player_name} to playersData with ID ${result.playerId}`);
              }
            });

            console.log('Updated playersData:', Object.keys(newPlayersData).length, 'players');
            setPlayersData(newPlayersData);
          })
          .catch(err => {
            console.error('Error fetching player data:', err);
          });

        // Return current state for now
        return currentPlayersData;
      });
    };

    fetchPlayerData();
  }, [draftState?.draft_session.picks, draftId]);

  return playersData;
};

/**
 * Utility function to get user's drafted players with their pick info
 */
export const getUserDraftedPlayers = (
  draftState: DraftStateResponse | null,
  playersData: Record<string, Player>
): (Player & { pick_number: number; round_number: number })[] => {
  console.log('getUserDraftedPlayers Debug:', {
    hasDraftState: !!draftState,
    playersDataCount: Object.keys(playersData).length,
    playersDataKeys: Object.keys(playersData)
  });
  
  if (!draftState) return [];
  
  const userTeam = draftState.draft_session.teams?.find(team => team.is_user);
  if (!userTeam) {
    console.log('getUserDraftedPlayers: No user team found');
    return [];
  }

  console.log('getUserDraftedPlayers: User team found:', userTeam.team_name, userTeam.id);

  // Get all user's picks that have been completed
  const userPicks = draftState.draft_session.picks?.filter(pick => 
    pick.team_id === userTeam.id && pick.picked_at !== null && pick.player_id
  ) || [];

  console.log('getUserDraftedPlayers: User picks found:', {
    totalUserPicks: userPicks.length,
    userPickDetails: userPicks.map(p => ({
      id: p.id,
      player_id: p.player_id,
      pick_number: p.pick_number,
      team_id: p.team_id,
      picked_at: p.picked_at,
      hasPlayerData: !!playersData[p.player_id!]
    }))
  });

  // Return the players with pick info, using playersData
  const result = userPicks.map(pick => {
    const player = playersData[pick.player_id!];
    if (!player) {
      console.log(`getUserDraftedPlayers: No player data found for player_id ${pick.player_id}`);
      return null;
    }

    console.log(`getUserDraftedPlayers: Found player data for ${player.player_name}`);
    return {
      ...player,
      pick_number: pick.pick_number,
      round_number: pick.round_number
    };
  }).filter(Boolean) as (Player & { pick_number: number; round_number: number })[];

  console.log('getUserDraftedPlayers Final Result:', {
    resultCount: result.length,
    players: result.map(p => ({ name: p.player_name, pick: p.pick_number }))
  });

  return result;
};

/**
 * Utility to check if a player is available in playersData
 */
export const getPlayerFromData = (
  playerId: string | undefined,
  playersData: Record<string, Player>
): Player | undefined => {
  if (!playerId) return undefined;
  return playersData[playerId];
};