import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  useToast,
  Grid,
  Text,
  useColorModeValue,
  ChakraProvider,
  Button
} from '@chakra-ui/react';

import { ScoringType, DraftType, DraftConfigurationCreate, RosterPositions } from '../types/draftConfig';
import { draftApi } from '../services/draftApi';
import { DraftSessionCreate, DraftTeamCreate } from '../types/draft';
import DraftInterface from './DraftInterface';
import LeagueSettings from './LeagueSettings';
import RosterConfiguration from './RosterConfiguration';
import ConfigurationSummary from './ConfigurationSummary';

const DEFAULT_ROSTER: RosterPositions = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  superflex: 0,
  k: 1,
  dst: 1,
  bench: 7
};

const ModernDraftConfiguration: React.FC = () => {
  const [config, setConfig] = useState<DraftConfigurationCreate>({
    scoring_type: ScoringType.HALF_PPR,
    draft_type: DraftType.SNAKE,
    draft_position: null,
    num_teams: 12,
    roster_positions: DEFAULT_ROSTER
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const toast = useToast();

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const primaryColor = 'purple';
  const accentColor = 'teal';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Generate teams with user at configured position
      const userPosition = config.draft_position ? config.draft_position - 1 : Math.floor(Math.random() * config.num_teams);
      const teams: DraftTeamCreate[] = [];
      
      for (let i = 0; i < config.num_teams; i++) {
        teams.push({
          team_index: i,
          team_name: i === userPosition ? 'Your Team' : `AI Team ${i + 1}`,
          is_user: i === userPosition
        });
      }

      // Create the draft session
      const draftSessionData: DraftSessionCreate = {
        num_teams: config.num_teams,
        draft_type: config.draft_type,
        scoring_type: config.scoring_type,
        roster_positions: {
          qb: config.roster_positions.qb,
          rb: config.roster_positions.rb,
          wr: config.roster_positions.wr,
          te: config.roster_positions.te,
          flex: config.roster_positions.flex,
          k: config.roster_positions.k,
          dst: config.roster_positions.dst,
          bench: config.roster_positions.bench
        },
        teams: teams
      };

      const draftSession = await draftApi.createDraftSession(draftSessionData);
      
      toast({
        title: 'Draft Created Successfully!',
        description: `Your draft position is ${userPosition + 1}. Starting your mock draft...`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Transition to draft interface
      setCurrentDraftId(draftSession.id);
      
    } catch (error) {
      console.error('Draft creation error:', error);
      toast({
        title: 'Error Creating Draft',
        description: error instanceof Error ? error.message : 'Failed to create draft session. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRosterPosition = (position: keyof RosterPositions, value: string) => {
    const numValue = parseInt(value) || 0;
    setConfig(prev => ({
      ...prev,
      roster_positions: {
        ...prev.roster_positions,
        [position]: numValue
      }
    }));
  };

  const handleBackToConfiguration = () => {
    setCurrentDraftId(null);
  };

  const totalRosterSpots = Object.values(config.roster_positions).reduce((sum, count) => sum + count, 0);

  // If we have a draft ID, show the draft interface
  if (currentDraftId) {
    return (
      <ChakraProvider>
        <Box>
          <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white" boxShadow="sm">
            <Button variant="outline" onClick={handleBackToConfiguration}>
              ← Back to Configuration
            </Button>
          </Box>
          <DraftInterface draftId={currentDraftId} />
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Box bg={bgColor} minH="100vh" py={8}>
      <Box maxW="6xl" mx="auto" px={6}>
        {/* Header */}
        <VStack spacing={2} mb={8}>
          <Heading as="h1" size="xl" color={`${primaryColor}.600`} fontWeight="bold">
            Draft Configuration
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Customize your mock draft settings below
          </Text>
        </VStack>

        {/* Main Configuration Cards */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          
          {/* Left Column - Main Settings */}
          <VStack spacing={6} align="stretch">
            
            {/* League Settings Card */}
            <LeagueSettings
              config={config}
              onConfigChange={setConfig}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />

            {/* Roster Positions Card */}
            <RosterConfiguration
              rosterPositions={config.roster_positions}
              onUpdateRosterPosition={updateRosterPosition}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </VStack>

          {/* Right Column - Summary & Actions */}
          <ConfigurationSummary
            config={config}
            totalRosterSpots={totalRosterSpots}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        </Grid>
      </Box>
    </Box>
    </ChakraProvider>
  );
};

export default ModernDraftConfiguration;