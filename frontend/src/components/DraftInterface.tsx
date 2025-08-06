import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorModeValue,
  Heading
} from '@chakra-ui/react';
import DraftBoard from './DraftBoard';
import PlayerSearch from './PlayerSearch';
import {
  DraftStateResponse,
  Player,
  MakePickRequest,
  DraftStatus,
  DraftTeam
} from '../types/draft';
import { draftApi } from '../services/draftApi';

interface DraftInterfaceProps {
  draftId: string;
}

const DraftInterface: React.FC<DraftInterfaceProps> = ({ draftId }) => {
  const [draftState, setDraftState] = useState<DraftStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [makingPick, setMakingPick] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color scheme - consistent with configuration page
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const primaryColor = 'purple';
  const accentColor = 'teal';

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
      await draftApi.makePickForTeam(
        draftId,
        draftState.current_team.id,
        pickRequest
      );

      // Refresh draft state
      await fetchDraftState();
      
      toast({
        title: 'Pick successful!',
        description: `You drafted ${selectedPlayer?.player_name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
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

  // Helper functions to get scoring-specific player data
  const getPlayerEcrRank = (player: Player, scoringType: string): number | undefined => {
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

  const getPlayerAdp = (player: Player, scoringType: string): number | undefined => {
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

  const getPlayerPreviousYearPoints = (player: Player, scoringType: string): number | undefined => {
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
      {/* Draft Status Header */}
      <Card mb={6} bg={cardBg} shadow="sm" border="1px" borderColor={borderColor}>
        <CardBody>
          <Grid templateColumns="1fr auto 1fr" gap={6} alignItems="center">
            {/* Draft Info */}
            <VStack align="start" spacing={2}>
              <HStack>
                <Heading as="h1" size="xl" color={`${primaryColor}.600`} fontWeight="bold">
                  Mock Draft
                </Heading>
                <Badge
                  colorScheme={
                    draft_session.status === DraftStatus.IN_PROGRESS ? 'green' :
                    draft_session.status === DraftStatus.COMPLETED ? 'blue' : 'gray'
                  }
                  fontSize="sm"
                >
                  {draft_session.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </HStack>
              
              <HStack spacing={4}>
                <Badge colorScheme={primaryColor} size="sm">
                  {draft_session.draft_type.toUpperCase()}
                </Badge>
                <Badge colorScheme={accentColor} size="sm">
                  {draft_session.scoring_type.replace('_', ' ').toUpperCase()}
                </Badge>
                <Text color="gray.600" fontSize="sm">
                  {draft_session.num_teams} teams
                </Text>
              </HStack>
            </VStack>

            {/* Current Pick Status */}
            <VStack spacing={2}>
              <Text fontSize="lg" textAlign="center" color="gray.600">
                Round {draft_session.current_round} • Pick {draft_session.current_pick}
              </Text>
              
              {draft_session.status === DraftStatus.IN_PROGRESS ? (
                <VStack spacing={1}>
                  <Text fontSize="xl" fontWeight="bold" textAlign="center">
                    {current_team.team_name}
                  </Text>
                  {isUserTurn() ? (
                    <Badge colorScheme={accentColor} fontSize="md" p={2}>
                      YOUR TURN
                    </Badge>
                  ) : (
                    <Badge colorScheme={primaryColor} fontSize="sm">
                      On the clock
                    </Badge>
                  )}
                </VStack>
              ) : draft_session.status === DraftStatus.CREATED ? (
                <Button 
                  colorScheme={primaryColor} 
                  onClick={handleStartDraft}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                  Start Draft
                </Button>
              ) : (
                <Badge colorScheme="gray" fontSize="md">
                  Draft Complete
                </Badge>
              )}
            </VStack>

            {/* User Team Info */}
            {userTeam && (
              <VStack align="end" spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {userTeam.team_name}
                </Text>
                
                <StatGroup>
                  <Stat textAlign="center">
                    <StatLabel fontSize="xs">Picks Made</StatLabel>
                    <StatNumber fontSize="md">
                      {Object.values(userTeam.current_roster).reduce((sum, count) => sum + count, 0)}
                    </StatNumber>
                  </Stat>
                  <Stat textAlign="center">
                    <StatLabel fontSize="xs">Remaining</StatLabel>
                    <StatNumber fontSize="md">
                      {draft_session.total_rounds - Object.values(userTeam.current_roster).reduce((sum, count) => sum + count, 0)}
                    </StatNumber>
                  </Stat>
                </StatGroup>
              </VStack>
            )}
          </Grid>
        </CardBody>
      </Card>

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
          />
        </GridItem>

        {/* Player Search Panel */}
        <GridItem w="500px" flexShrink={0} overflow="auto">
          <PlayerSearch
            draftId={draftId}
            onPlayerSelect={handlePlayerSelect}
            onMakePick={handleMakePick}
            canMakePick={isUserTurn() && draft_session.status === DraftStatus.IN_PROGRESS}
            currentUserTeamId={userTeam?.id}
            scoringType={draft_session.scoring_type}
          />
        </GridItem>
      </Grid>

      {/* Player Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPlayer?.player_name} - {selectedPlayer?.position} • {selectedPlayer?.team}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPlayer && (
              <VStack spacing={4} align="stretch">
                {/* Player Stats */}
                <Card>
                  <CardBody>
                    <Text fontSize="lg" fontWeight="bold" mb={3}>
                      Player Rankings & Stats
                    </Text>
                    
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <Stat>
                        <StatLabel>ECR Rank</StatLabel>
                        <StatNumber>
                          {getPlayerEcrRank(selectedPlayer, draft_session.scoring_type) || '—'}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>ADP</StatLabel>
                        <StatNumber>
                          {getPlayerAdp(selectedPlayer, draft_session.scoring_type)?.toFixed(1) || '—'}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>2023 Points</StatLabel>
                        <StatNumber>
                          {getPlayerPreviousYearPoints(selectedPlayer, draft_session.scoring_type)?.toFixed(1) || '—'}
                        </StatNumber>
                      </Stat>
                    </Grid>
                  </CardBody>
                </Card>

                {/* Draft Action */}
                {isUserTurn() && draft_session.status === DraftStatus.IN_PROGRESS && (
                  <Card>
                    <CardBody>
                      <VStack spacing={3}>
                        <Text fontSize="lg" fontWeight="bold">
                          Draft This Player?
                        </Text>
                        
                        <HStack spacing={3}>
                          <Button
                            colorScheme="green"
                            size="lg"
                            isLoading={makingPick}
                            loadingText="Drafting..."
                            onClick={() => handleMakePick({ player_id: selectedPlayer.id })}
                          >
                            Draft {selectedPlayer.player_name}
                          </Button>
                          
                          <Button variant="outline" onClick={onClose}>
                            Keep Looking
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DraftInterface;