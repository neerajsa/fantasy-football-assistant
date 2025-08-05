import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Badge,
  Grid,
  GridItem
} from '@chakra-ui/react';
import DraftInterface from './DraftInterface';
import {
  DraftSessionCreate,
  DraftType,
  ScoringType,
  DraftTeamCreate
} from '../types/draft';
import { draftApi } from '../services/draftApi';

const DraftLauncher: React.FC = () => {
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft configuration state
  const [numTeams, setNumTeams] = useState(10);
  const [draftType, setDraftType] = useState<DraftType>(DraftType.SNAKE);
  const [scoringType, setScoringType] = useState<ScoringType>(ScoringType.PPR);
  const [userTeamName, setUserTeamName] = useState('Your Team');

  const toast = useToast();

  // Default roster positions
  const defaultRosterPositions = {
    qb: 1,
    rb: 2,
    wr: 2,
    te: 1,
    flex: 1,
    k: 1,
    dst: 1,
    bench: 6
  };

  // Create a new draft session
  const handleCreateDraft = async () => {
    setCreating(true);
    setError(null);

    try {
      // Generate teams
      const teams: DraftTeamCreate[] = [];
      
      // Add user team at random position
      const userPosition = Math.floor(Math.random() * numTeams);
      
      for (let i = 0; i < numTeams; i++) {
        teams.push({
          team_index: i,
          team_name: i === userPosition ? userTeamName : `AI Team ${i + 1}`,
          is_user: i === userPosition
        });
      }

      const draftData: DraftSessionCreate = {
        num_teams: numTeams,
        draft_type: draftType,
        scoring_type: scoringType,
        roster_positions: defaultRosterPositions,
        teams: teams
      };

      const draft = await draftApi.createDraftSession(draftData);
      setCurrentDraftId(draft.id);

      toast({
        title: 'Draft created!',
        description: `Your draft is ready. You're at position ${userPosition + 1}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create draft';
      setError(errorMessage);
      
      toast({
        title: 'Failed to create draft',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  // Reset to launcher
  const handleBackToLauncher = () => {
    setCurrentDraftId(null);
    setError(null);
  };

  // If we have a draft ID, show the draft interface
  if (currentDraftId) {
    return (
      <Box>
        <Box p={4} borderBottom="1px solid" borderColor="gray.200">
          <Button variant="outline" onClick={handleBackToLauncher}>
            ← Back to Launcher
          </Button>
        </Box>
        <DraftInterface draftId={currentDraftId} />
      </Box>
    );
  }

  // Show draft creation form
  return (
    <Box p={8} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" mb={2}>
            Fantasy Football Mock Draft
          </Text>
          <Text fontSize="lg" color="gray.600">
            Create and run a mock draft to practice your strategy
          </Text>
        </Box>

        {/* Draft Configuration */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="xl" fontWeight="bold">
                Draft Settings
              </Text>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text mb={2} fontWeight="semibold">Number of Teams</Text>
                  <Select
                    value={numTeams}
                    onChange={(e) => setNumTeams(parseInt(e.target.value))}
                  >
                    {[8, 10, 12, 14, 16].map(num => (
                      <option key={num} value={num}>{num} Teams</option>
                    ))}
                  </Select>
                </GridItem>

                <GridItem>
                  <Text mb={2} fontWeight="semibold">Draft Type</Text>
                  <Select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as DraftType)}
                  >
                    <option value={DraftType.SNAKE}>Snake Draft</option>
                    <option value={DraftType.LINEAR}>Linear Draft</option>
                  </Select>
                </GridItem>

                <GridItem>
                  <Text mb={2} fontWeight="semibold">Scoring Type</Text>
                  <Select
                    value={scoringType}
                    onChange={(e) => setScoringType(e.target.value as ScoringType)}
                  >
                    <option value={ScoringType.STANDARD}>Standard</option>
                    <option value={ScoringType.PPR}>PPR</option>
                    <option value={ScoringType.HALF_PPR}>Half PPR</option>
                  </Select>
                </GridItem>

                <GridItem>
                  <Text mb={2} fontWeight="semibold">Your Team Name</Text>
                  <Input
                    value={userTeamName}
                    onChange={(e) => setUserTeamName(e.target.value)}
                    placeholder="Enter your team name"
                  />
                </GridItem>
              </Grid>

              {/* Roster Settings Display */}
              <Box>
                <Text fontWeight="semibold" mb={2}>Roster Configuration</Text>
                <HStack spacing={2} flexWrap="wrap">
                  {Object.entries(defaultRosterPositions).map(([pos, count]) => (
                    <Badge key={pos} variant="outline" p={1}>
                      {pos.toUpperCase()}: {count}
                    </Badge>
                  ))}
                </HStack>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Total: {Object.values(defaultRosterPositions).reduce((sum, count) => sum + count, 0)} rounds
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Failed to create draft</Text>
              <Text>{error}</Text>
            </Box>
          </Alert>
        )}

        {/* Create Draft Button */}
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleCreateDraft}
          isLoading={creating}
          loadingText="Creating Draft..."
          disabled={!userTeamName.trim()}
        >
          Create Mock Draft
        </Button>

        {/* Info */}
        <Card variant="outline">
          <CardBody>
            <Text fontSize="sm" color="gray.600">
              <strong>Note:</strong> This will create a mock draft with AI opponents. 
              You'll be randomly assigned a draft position and can practice your draft strategy 
              against computer-controlled teams.
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default DraftLauncher;