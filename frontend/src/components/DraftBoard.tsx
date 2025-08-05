import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Text,
  Badge,
  Card,
  CardBody,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Tooltip,
  Button,
  Flex,
  Divider,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import {
  DraftSession,
  DraftStateResponse,
  DraftPick,
  DraftTeam,
  DraftBoardCell,
  DraftStatus,
  Player
} from '../types/draft';
import { draftApi } from '../services/draftApi';

interface DraftBoardProps {
  draftId: string;
  onPlayerSelect?: (player: Player) => void;
  refreshInterval?: number;
}

const DraftBoard: React.FC<DraftBoardProps> = ({ 
  draftId, 
  onPlayerSelect,
  refreshInterval = 5000 
}) => {
  const [draftState, setDraftState] = useState<DraftStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const currentPickBg = useColorModeValue('blue.100', 'blue.900');
  const userTeamBg = useColorModeValue('green.50', 'green.900');
  const completedPickBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch draft state
  const fetchDraftState = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const state = await draftApi.getDraftState(draftId);
      setDraftState(state);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch draft state';
      setError(errorMessage);
      
      if (!draftState) {
        // Only show toast if we don't have existing data
        toast({
          title: 'Error loading draft',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [draftId, draftState, toast]);

  // Initial load
  useEffect(() => {
    fetchDraftState();
  }, [fetchDraftState]);

  // Auto-refresh for live updates
  useEffect(() => {
    if (!refreshInterval || draftState?.draft_session.status !== DraftStatus.IN_PROGRESS) {
      return;
    }

    const interval = setInterval(() => {
      fetchDraftState();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDraftState, refreshInterval, draftState?.draft_session.status]);

  // Generate draft board cells
  const generateDraftBoard = (session: DraftSession): DraftBoardCell[][] => {
    const board: DraftBoardCell[][] = [];
    
    for (let round = 1; round <= session.total_rounds; round++) {
      const roundCells: DraftBoardCell[] = [];
      
      for (let teamIndex = 0; teamIndex < session.num_teams; teamIndex++) {
        // Calculate pick number based on draft type
        let pickNumber: number;
        
        if (session.draft_type === 'snake') {
          const isEvenRound = round % 2 === 0;
          const positionInRound = isEvenRound 
            ? session.num_teams - teamIndex 
            : teamIndex + 1;
          pickNumber = (round - 1) * session.num_teams + positionInRound;
        } else {
          // Linear draft
          pickNumber = (round - 1) * session.num_teams + teamIndex + 1;
        }

        // Find the corresponding pick
        const pick = session.picks?.find(p => p.pick_number === pickNumber);
        
        // Find the team
        const team = session.teams?.find(t => t.team_index === teamIndex);
        
        const cell: DraftBoardCell = {
          round,
          team_index: teamIndex,
          pick_number: pickNumber,
          pick: pick,
          is_current: pickNumber === session.current_pick,
          is_user_team: team?.is_user || false
        };
        
        roundCells.push(cell);
      }
      
      board.push(roundCells);
    }
    
    return board;
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDraftState(true);
  };

  // Handle player selection from recent picks
  const handlePlayerClick = (player: Player) => {
    if (onPlayerSelect) {
      onPlayerSelect(player);
    }
  };

  if (loading && !draftState) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading draft board...</Text>
      </Box>
    );
  }

  if (error && !draftState) {
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

  if (!draftState) {
    return (
      <Alert status="warning">
        <AlertIcon />
        No draft data available
      </Alert>
    );
  }

  const { draft_session, current_team, recent_picks } = draftState;
  const draftBoard = generateDraftBoard(draft_session);

  return (
    <Box p={4}>
      {/* Draft Header */}
      <Card mb={4} bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <VStack align="start" spacing={1}>
              <HStack>
                <Text fontSize="2xl" fontWeight="bold">
                  Draft Board
                </Text>
                <Badge
                  colorScheme={
                    draft_session.status === DraftStatus.IN_PROGRESS ? 'green' :
                    draft_session.status === DraftStatus.COMPLETED ? 'blue' : 'gray'
                  }
                  fontSize="sm"
                >
                  {draft_session.status}
                </Badge>
              </HStack>
              
              <HStack spacing={4}>
                <Text color="gray.600">
                  Round {draft_session.current_round} • Pick {draft_session.current_pick}
                </Text>
                <Text color="blue.600" fontWeight="semibold">
                  {current_team.team_name}'s Turn
                </Text>
              </HStack>
            </VStack>

            <HStack>
              <IconButton
                aria-label="Refresh draft"
                icon={<RepeatIcon />}
                onClick={handleRefresh}
                isLoading={refreshing}
                size="sm"
              />
              
              <VStack spacing={0} align="end">
                <Text fontSize="sm" color="gray.600">
                  {draft_session.draft_type.toUpperCase()} • {draft_session.scoring_type.toUpperCase()}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {draft_session.num_teams} Teams • {draft_session.total_rounds} Rounds
                </Text>
              </VStack>
            </HStack>
          </Flex>

          {error && (
            <Alert status="warning" size="sm" mb={4}>
              <AlertIcon />
              <Text fontSize="sm">
                Connection issue: {error} (showing cached data)
              </Text>
            </Alert>
          )}
        </CardBody>
      </Card>

      {/* Team Headers */}
      <Card mb={4} bg={cardBg} borderColor={borderColor}>
        <CardBody p={2}>
          <HStack spacing={2} justify="space-between">
            {draft_session.teams?.map((team, index) => (
              <Box
                key={team.id}
                flex={1}
                textAlign="center"
                p={2}
                bg={team.is_user ? userTeamBg : 'transparent'}
                borderRadius="md"
                border={team.team_index === draft_session.current_team_index ? '2px solid' : '1px solid'}
                borderColor={team.team_index === draft_session.current_team_index ? 'blue.400' : borderColor}
              >
                <Text fontSize="sm" fontWeight={team.is_user ? 'bold' : 'medium'} isTruncated>
                  {team.team_name}
                </Text>
                {team.is_user && (
                  <Badge size="sm" colorScheme="green" mt={1}>
                    You
                  </Badge>
                )}
              </Box>
            ))}
          </HStack>
        </CardBody>
      </Card>

      {/* Draft Board Grid */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody p={2}>
          <VStack spacing={1}>
            {draftBoard.map((round, roundIndex) => (
              <HStack key={roundIndex} spacing={1} w="full">
                {/* Round number */}
                <Box
                  w="40px"
                  textAlign="center"
                  py={2}
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.600"
                >
                  R{roundIndex + 1}
                </Box>
                
                {/* Pick cells */}
                {round.map((cell, cellIndex) => (
                  <Tooltip
                    key={cellIndex}
                    label={`Round ${cell.round}, Pick ${cell.pick_number}${cell.pick?.player ? ` - ${cell.pick.player?.player_name || 'Unknown Player'}` : ''}`}
                    hasArrow
                  >
                    <Box
                      flex={1}
                      minH="60px"
                      p={1}
                      bg={
                        cell.is_current ? currentPickBg :
                        cell.pick?.player_id ? completedPickBg :
                        cell.is_user_team ? userTeamBg : 'transparent'
                      }
                      border="1px solid"
                      borderColor={
                        cell.is_current ? 'blue.400' : borderColor
                      }
                      borderRadius="md"
                      cursor={cell.pick?.player_id ? 'pointer' : 'default'}
                      onClick={() => cell.pick?.player && handlePlayerClick(cell.pick.player as Player)}
                      transition="all 0.2s"
                      _hover={cell.pick?.player_id ? { transform: 'scale(1.02)' } : {}}
                    >
                      <VStack spacing={0} h="full" justify="center">
                        <Text fontSize="xs" color="gray.500">
                          {cell.pick_number}
                        </Text>
                        
                        {cell.pick?.player_id ? (
                          <>
                            <Text fontSize="xs" fontWeight="bold" textAlign="center" noOfLines={1}>
                              {(cell.pick.player as any)?.player_name || 'Unknown'}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {(cell.pick.player as any)?.position} • {(cell.pick.player as any)?.team}
                            </Text>
                          </>
                        ) : cell.is_current ? (
                          <Text fontSize="xs" color="blue.600" fontWeight="bold">
                            ON CLOCK
                          </Text>
                        ) : (
                          <Text fontSize="xs" color="gray.400">
                            —
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  </Tooltip>
                ))}
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Recent Picks */}
      {recent_picks.length > 0 && (
        <Card mt={4} bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={3}>
              Recent Picks
            </Text>
            <VStack spacing={2} align="stretch">
              {recent_picks.slice(0, 5).map((pick, index) => (
                <Box
                  key={pick.id}
                  p={3}
                  bg={index === 0 ? currentPickBg : completedPickBg}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => (pick.player as Player) && handlePlayerClick(pick.player as Player)}
                  _hover={{ transform: 'scale(1.01)' }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">
                        {(pick.player as any)?.player_name || 'Unknown Player'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {(pick.player as any)?.position} • {(pick.player as any)?.team}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Pick {pick.pick_number}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Round {pick.round_number}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default DraftBoard;