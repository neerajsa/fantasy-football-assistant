import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Text,
  Alert,
  AlertIcon,
  useToast,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import DraftBoard from './DraftBoard';
import DraftPanel from './DraftPanel';
import DraftHeader from './DraftHeader';
import PlayerDetailModal from '../player/PlayerDetailModal';
import {
  DraftStateResponse,
  Player,
  MakePickRequest,
  DraftStatus,
  DraftTeam
} from '../../types/draft';
import { draftApi } from '../../services/draftApi';

interface DraftInterfaceProps {
  draftId: string;
}

const DraftInterface: React.FC<DraftInterfaceProps> = ({ draftId }) => {
  const [draftState, setDraftState] = useState<DraftStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [makingPick, setMakingPick] = useState(false);
  const [playerSearchRefreshTrigger, setPlayerSearchRefreshTrigger] = useState(0);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color scheme - consistent with configuration page
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Fetch draft state
  const fetchDraftState = useCallback(async () => {
    try {
      const state = await draftApi.getDraftState(draftId);
      setDraftState(state);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch draft state';
      setError(errorMessage);
      
      toast({
        title: 'Error loading draft',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [draftId, toast]);

  // Initial load
  useEffect(() => {
    fetchDraftState();
  }, [fetchDraftState]);

  // Auto-refresh when draft is in progress
  useEffect(() => {
    if (draftState?.draft_session.status !== DraftStatus.IN_PROGRESS) {
      return;
    }

    const interval = setInterval(() => {
      fetchDraftState();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchDraftState, draftState?.draft_session.status]);

  // Trigger PlayerSearch refresh when draft state changes
  useEffect(() => {
    if (draftState) {
      setPlayerSearchRefreshTrigger(prev => prev + 1);
    }
  }, [draftState?.draft_session.current_pick]);

  // Handle player selection
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    onOpen();
  };

  // Handle making a pick
  const handleMakePick = async (pickRequest: MakePickRequest) => {
    if (!draftState?.current_team.is_user) {
      throw new Error('Not your turn to pick');
    }

    setMakingPick(true);
    
    try {
      // Step 1: Make the user's pick and wait for completion
      await draftApi.makePickForTeam(
        draftId,
        draftState.current_team.id,
        pickRequest
      );

      // Step 2: Refresh draft state to reflect user's pick immediately
      await fetchDraftState();
      
      // Step 3: Show success toast for user's pick
      toast({
        title: 'Pick successful!',
        description: `You drafted ${pickRequest.player_name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Step 4: Close modal
      onClose();

      // Step 5: Start cell-by-cell progression for any subsequent AI picks
      // This processes one pick at a time with proper visual progression
      processNextPick();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make pick';
      
      toast({
        title: 'Pick failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      throw err; // Re-throw so PlayerSearch can handle it
    } finally {
      setMakingPick(false);
    }
  };

  // Start draft if it's in created status
  const handleStartDraft = async () => {
    try {
      await draftApi.startDraftSession(draftId);
      await fetchDraftState();
      
      toast({
        title: 'Draft started!',
        description: 'The draft is now in progress',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Start cell-by-cell progression if first pick is AI
      processNextPick();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start draft';
      
      toast({
        title: 'Failed to start draft',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Get user team
  const getUserTeam = (): DraftTeam | undefined => {
    return draftState?.draft_session.teams?.find(team => team.is_user);
  };

  // Check if it's user's turn
  const isUserTurn = (): boolean => {
    return draftState?.current_team.is_user || false;
  };

  // Check if a player is already drafted
  const isPlayerDrafted = (player: Player): boolean => {
    if (!draftState?.draft_session.picks) return false;
    return draftState.draft_session.picks.some(pick => 
      pick.player_id === player.id && pick.picked_at !== null
    );
  };

  // Process next pick in sequence - handles both user and AI picks
  const processNextPick = async () => {
    if (!draftState) return;

    // Refresh draft state to get current status
    await fetchDraftState();
    
    // Get updated draft state
    const updatedState = await draftApi.getDraftState(draftId);
    
    // Check if draft is complete or not in progress
    if (updatedState.draft_session.status !== DraftStatus.IN_PROGRESS) {
      return;
    }

    const currentTeam = updatedState.current_team;
    
    // If it's a user team, stop processing and wait for user input
    if (currentTeam.is_user) {
      return;
    }

    // If it's an AI team, make the AI pick
    try {
      // Add a small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make single AI pick
      await draftApi.makeAIPick(draftId);
      
      // Refresh state after AI pick
      await fetchDraftState();
      
      // Recursively process the next pick
      await processNextPick();
    } catch (error) {
      console.error('Error making AI pick:', error);
      
      toast({
        title: 'AI Pick Error',
        description: 'There was an issue with the AI pick. Please continue manually.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Text>Loading draft interface...</Text>
      </Box>
    );
  }

  if (error || !draftState) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Error loading draft</Text>
          <Text>{error}</Text>
        </Box>
      </Alert>
    );
  }

  const { draft_session, current_team } = draftState;
  const userTeam = getUserTeam();

  return (
    <Box bg={bgColor} minH="100vh" p={4}>
      {/* Draft Header */}
      <DraftHeader
        draftSession={draft_session}
        currentTeam={current_team}
        userTeam={userTeam}
        isUserTurn={isUserTurn()}
        onStartDraft={handleStartDraft}
      />

      {/* Main Draft Interface */}
      <Grid 
        templateColumns={{ base: '1fr', xl: '1fr 500px' }} 
        gap={4}
        w="100%"
        h="90vh"
      >
        {/* Draft Board */}
        <GridItem overflow="auto" minW={0}>
          <DraftBoard
            draftId={draftId}
            onPlayerSelect={handlePlayerSelect}
            refreshInterval={draft_session.status === DraftStatus.IN_PROGRESS ? 5000 : 0}
            draftState={draftState}
          />
        </GridItem>

        {/* Draft Panel */}
        <GridItem w="500px" flexShrink={0} overflow="auto">
          <DraftPanel
            draftId={draftId}
            onPlayerSelect={handlePlayerSelect}
            onMakePick={handleMakePick}
            canMakePick={isUserTurn() && draft_session.status === DraftStatus.IN_PROGRESS}
            currentUserTeamId={userTeam?.id}
            scoringType={draft_session.scoring_type}
            refreshTrigger={playerSearchRefreshTrigger}
            draftState={draftState}
          />
        </GridItem>
      </Grid>

      {/* Player Detail Modal */}
      <PlayerDetailModal
        isOpen={isOpen}
        onClose={onClose}
        selectedPlayer={selectedPlayer}
        scoringType={draft_session.scoring_type}
        draftStatus={draft_session.status}
        isPlayerDrafted={isPlayerDrafted}
        isUserTurn={isUserTurn()}
        makingPick={makingPick}
        onMakePick={handleMakePick}
      />
    </Box>
  );
};

export default DraftInterface;