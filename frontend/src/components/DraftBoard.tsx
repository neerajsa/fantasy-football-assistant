import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
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
  useToast,
  Grid,
  Heading
} from '@chakra-ui/react';
import {
  DraftSession,
  DraftStateResponse,
  DraftBoardCell,
  DraftStatus,
  Player
} from '../types/draft';
import { draftApi } from '../services/draftApi';
import { useDraftPlayerData, getPlayerFromData } from '../utils/draftPlayerData';

interface DraftBoardProps {
  draftId: string;
  onPlayerSelect?: (player: Player) => void;
  refreshInterval?: number;
  draftState?: DraftStateResponse | null;
}

const DraftBoard: React.FC<DraftBoardProps> = ({ 
  draftId, 
  onPlayerSelect,
  refreshInterval = 5000,
  draftState: propDraftState = null
}) => {
  const [internalDraftState, setInternalDraftState] = useState<DraftStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use prop data if available, otherwise use internal state
  const draftState = propDraftState || internalDraftState;
  
  // Use shared player data hook
  const playersData = useDraftPlayerData(draftId, draftState);

  const toast = useToast();
  
  // Color scheme - consistent with configuration page
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const primaryColor = 'purple';
  const accentColor = 'teal';
  
  // Draft board specific colors
  const currentPickBg = useColorModeValue('purple.100', 'purple.900');
  const userTeamBg = useColorModeValue('teal.50', 'teal.900');
  const completedPickBg = useColorModeValue('gray.50', 'gray.700');
  
  // Position-based background colors (matches PlayerRow position badges)
  const positionColors = {
    'QB': useColorModeValue('red.50', 'red.900'),
    'RB': useColorModeValue('green.50', 'green.900'),
    'WR': useColorModeValue('blue.50', 'blue.900'),
    'TE': useColorModeValue('purple.50', 'purple.900'),
    'K': useColorModeValue('orange.50', 'orange.900'),
    'DST': useColorModeValue('gray.50', 'gray.700')
  };

  // Get position-based background color
  const getPositionBackgroundColor = (position: string): string => {
    return positionColors[position as keyof typeof positionColors] || positionColors['DST'];
  };

  // Fetch draft state
  const fetchDraftState = useCallback(async () => {
    try {
      const state = await draftApi.getDraftState(draftId);
      setInternalDraftState(state);
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

  // Initial load - only if no prop data provided
  useEffect(() => {
    if (!propDraftState) {
      fetchDraftState();
    } else {
      setLoading(false);
    }
  }, [propDraftState, fetchDraftState]);

  // Auto-refresh for live updates - only if no prop data provided
  useEffect(() => {
    if (propDraftState || !refreshInterval || draftState?.draft_session.status !== DraftStatus.IN_PROGRESS) {
      return;
    }

    const interval = setInterval(() => {
      fetchDraftState();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [propDraftState, fetchDraftState, refreshInterval, draftState?.draft_session.status]);


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

  const { draft_session, recent_picks } = draftState;
  const draftBoard = generateDraftBoard(draft_session);

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert status="warning" size="sm" mb={4} borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            Connection issue: {error} (showing cached data)
          </Text>
        </Alert>
      )}

      {/* Draft Board Grid with Traditional Row Layout */}
      <Card bg={cardBg} shadow="sm" border="1px" borderColor={borderColor} w="100%">
        <CardBody p={4}>
          <Box
            overflowX="auto"
            w="100%"
            css={{
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            }}
          >
            <Box minW={`${draft_session.num_teams * 130}px`}>
              {/* Team Headers Row */}
              <Grid
                templateColumns={`40px repeat(${draft_session.num_teams}, minmax(120px, 1fr))`}
                gap={2}
                mb={2}
              >
                {/* Empty cell for round label column */}
                <Box></Box>
                
                {/* Team Headers */}
                {draft_session.teams?.map((team) => (
                  <Box
                    key={team.id}
                    textAlign="center"
                    p={3}
                    bg={team.is_user ? userTeamBg : cardBg}
                    borderRadius="md"
                    border={team.team_index === draft_session.current_team_index ? '2px solid' : '1px solid'}
                    borderColor={team.team_index === draft_session.current_team_index ? `${primaryColor}.400` : borderColor}
                    shadow="sm"
                  >
                    <Text fontSize="sm" fontWeight={team.is_user ? 'bold' : 'semibold'} isTruncated>
                      {team.team_name}
                    </Text>
                    {team.is_user && (
                      <Badge size="sm" colorScheme={accentColor} mt={1}>
                        You
                      </Badge>
                    )}
                  </Box>
                ))}
              </Grid>

              {/* Draft Rounds */}
              <VStack spacing={1} align="stretch">
                {draftBoard.map((round, roundIndex) => (
                  <Grid
                    key={roundIndex}
                    templateColumns={`40px repeat(${draft_session.num_teams}, minmax(120px, 1fr))`}
                    gap={2}
                  >
                    {/* Round Label */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.600"
                    >
                      R{roundIndex + 1}
                    </Box>

                    {/* Pick Cells for this round */}
                    {round.map((cell, cellIndex) => (
                      <Tooltip
                        key={cellIndex}
                        label={`Round ${cell.round}, Pick ${cell.pick_number}${cell.pick?.player_id && getPlayerFromData(cell.pick.player_id, playersData) ? ` - ${getPlayerFromData(cell.pick.player_id, playersData)!.player_name}` : ''}`}
                        hasArrow
                      >
                        <Box
                          minH="65px"
                          p={2}
                          bg={
                            cell.is_current ? currentPickBg :
                            cell.pick?.player_id && getPlayerFromData(cell.pick.player_id, playersData)
                              ? getPositionBackgroundColor(getPlayerFromData(cell.pick.player_id, playersData)!.position)
                              : cell.pick?.player_id ? completedPickBg :
                            cell.is_user_team ? userTeamBg : 'transparent'
                          }
                          border="1px solid"
                          borderColor={
                            cell.is_current ? `${primaryColor}.400` : borderColor
                          }
                          borderRadius="md"
                          cursor={cell.pick?.player_id && getPlayerFromData(cell.pick.player_id, playersData) ? 'pointer' : 'default'}
                          onClick={() => {
                            const player = getPlayerFromData(cell.pick?.player_id, playersData);
                            if (player) handlePlayerClick(player);
                          }}
                          transition="all 0.2s"
                          _hover={cell.pick?.player_id ? { transform: 'scale(1.02)', shadow: 'md' } : {}}
                        >
                          <VStack spacing={0} h="full" justify="center">
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              #{cell.pick_number}
                            </Text>
                            
                            {cell.pick?.player_id ? (
                              <>
                                <Text fontSize="xs" fontWeight="bold" textAlign="center" noOfLines={2}>
                                  {getPlayerFromData(cell.pick.player_id, playersData)?.player_name || 'Loading...'}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  {getPlayerFromData(cell.pick.player_id, playersData)?.position || ''}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {getPlayerFromData(cell.pick.player_id, playersData)?.team || ''}
                                </Text>
                              </>
                            ) : cell.is_current ? (
                              <VStack spacing={0}>
                                <Text fontSize="xs" color={`${primaryColor}.600`} fontWeight="bold">
                                  ON CLOCK
                                </Text>
                                <Badge size="xs" colorScheme={primaryColor} mt={1}>
                                  PICKING
                                </Badge>
                              </VStack>
                            ) : (
                              <Text fontSize="xs" color="gray.400">
                                —
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      </Tooltip>
                    ))}
                  </Grid>
                ))}
              </VStack>
            </Box>
          </Box>
        </CardBody>
      </Card>

      {/* Recent Picks */}
      {recent_picks.length > 0 && (
        <Card mt={4} bg={cardBg} shadow="sm" border="1px" borderColor={borderColor}>
          <CardBody>
            <Heading as="h3" size="sm" color={`${primaryColor}.600`} mb={3}>
              Recent Picks
            </Heading>
            <VStack spacing={2} align="stretch">
              {recent_picks.slice(0, 5).map((pick, index) => (
                <Box
                  key={pick.id}
                  p={3}
                  bg={index === 0 ? currentPickBg : completedPickBg}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => {
                    const player = getPlayerFromData(pick.player_id, playersData);
                    if (player) handlePlayerClick(player);
                  }}
                  _hover={{ transform: 'scale(1.01)', shadow: 'md' }}
                  transition="all 0.2s"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">
                        {getPlayerFromData(pick.player_id, playersData)?.player_name || 'Loading...'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {pick.player_id && getPlayerFromData(pick.player_id, playersData) ? `${getPlayerFromData(pick.player_id, playersData)!.position} • ${getPlayerFromData(pick.player_id, playersData)!.team}` : ''}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={0}>
                      <Badge colorScheme={primaryColor} size="sm">
                        Pick {pick.pick_number}
                      </Badge>
                      <Text fontSize="xs" color="gray.600" mt={1}>
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