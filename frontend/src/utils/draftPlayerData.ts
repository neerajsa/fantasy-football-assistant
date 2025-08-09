import { useState, useEffect } from 'react';
import { Player, DraftStateResponse } from '../types/draft';
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

        if (picksNeedingPlayerData.length === 0) {
          return currentPlayersData;
        }

        // Fetch player data for all picks that need it
        const playerPromises = picksNeedingPlayerData.map(pick =>
          draftApi.getPlayerFromPick(draftId, pick)
            .then(player => ({ pickId: pick.id, playerId: pick.player_id!, player }))
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
              }
            });
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
  if (!draftState) return [];
  
  const userTeam = draftState.draft_session.teams?.find(team => team.is_user);
  if (!userTeam) return [];

  // Get all user's picks that have been completed
  const userPicks = draftState.draft_session.picks?.filter(pick => 
    pick.team_id === userTeam.id && pick.picked_at !== null && pick.player_id
  ) || [];

  // Return the players with pick info, using playersData
  return userPicks.map(pick => {
    const player = playersData[pick.player_id!];
    if (!player) return null;

    return {
      ...player,
      pick_number: pick.pick_number,
      round_number: pick.round_number
    };
  }).filter(Boolean) as (Player & { pick_number: number; round_number: number })[];
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