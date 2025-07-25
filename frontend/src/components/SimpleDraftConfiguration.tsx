import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  VStack,
  HStack,
  Heading,
  useToast,
  Grid,
  GridItem,
  Text,
  Switch,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

import { ScoringType, DraftType, DraftConfigurationCreate, RosterPositions } from '../types/draftConfig';
import { draftConfigApi } from '../services/draftConfigApi';

const DEFAULT_ROSTER: RosterPositions = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  k: 1,
  dst: 1,
  bench: 6
};

const SimpleDraftConfiguration: React.FC = () => {
  const [config, setConfig] = useState<DraftConfigurationCreate>({
    scoring_type: ScoringType.PPR,
    draft_type: DraftType.SNAKE,
    draft_position: null,
    num_teams: 12,
    roster_positions: DEFAULT_ROSTER
  });
  
  const [useRandomPosition, setUseRandomPosition] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const submitConfig = {
        ...config,
        draft_position: useRandomPosition ? null : config.draft_position
      };
      
      const response = await draftConfigApi.createDraftConfiguration(submitConfig);
      
      if (response.success) {
        toast({
          title: 'Success!',
          description: `Draft configuration created. Your draft position is ${response.data?.draft_position}.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create draft configuration. Please try again.',
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

  const totalRosterSpots = Object.values(config.roster_positions).reduce((sum, count) => sum + count, 0);

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={8}>
        <Heading as="h2" size="xl" textAlign="center" color="blue.600">
          Configure Your Draft
        </Heading>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8} w="100%">
          <GridItem>
            <VStack spacing={6}>
              <FormControl>
                <FormLabel>Scoring System</FormLabel>
                <Select
                  value={config.scoring_type}
                  onChange={(e) => setConfig(prev => ({ ...prev, scoring_type: e.target.value as ScoringType }))}
                >
                  <option value={ScoringType.STANDARD}>Standard</option>
                  <option value={ScoringType.PPR}>PPR (Point Per Reception)</option>
                  <option value={ScoringType.HALF_PPR}>Half PPR</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Draft Type</FormLabel>
                <Select
                  value={config.draft_type}
                  onChange={(e) => setConfig(prev => ({ ...prev, draft_type: e.target.value as DraftType }))}
                >
                  <option value={DraftType.SNAKE}>Snake Draft</option>
                  <option value={DraftType.LINEAR}>Linear Draft</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Number of Teams</FormLabel>
                <NumberInput
                  value={config.num_teams}
                  onChange={(valueAsString, valueAsNumber) => setConfig(prev => ({ ...prev, num_teams: valueAsNumber }))}
                  min={4}
                  max={32}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Random Draft Position</FormLabel>
                <Switch
                  isChecked={useRandomPosition}
                  onChange={(e) => setUseRandomPosition(e.target.checked)}
                />
              </FormControl>
              
              {!useRandomPosition && (
                <FormControl>
                  <FormLabel>Draft Position</FormLabel>
                  <NumberInput
                    value={config.draft_position || 1}
                    onChange={(valueAsString, valueAsNumber) => setConfig(prev => ({ ...prev, draft_position: valueAsNumber }))}
                    min={1}
                    max={config.num_teams}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              )}
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={6}>
              <Heading as="h3" size="lg">Roster Positions</Heading>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                <FormControl>
                  <FormLabel>QB</FormLabel>
                  <NumberInput
                    value={config.roster_positions.qb}
                    onChange={(valueAsString) => updateRosterPosition('qb', valueAsString)}
                    min={0}
                    max={5}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>RB</FormLabel>
                  <NumberInput
                    value={config.roster_positions.rb}
                    onChange={(valueAsString) => updateRosterPosition('rb', valueAsString)}
                    min={0}
                    max={10}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>WR</FormLabel>
                  <NumberInput
                    value={config.roster_positions.wr}
                    onChange={(valueAsString) => updateRosterPosition('wr', valueAsString)}
                    min={0}
                    max={10}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>TE</FormLabel>
                  <NumberInput
                    value={config.roster_positions.te}
                    onChange={(valueAsString) => updateRosterPosition('te', valueAsString)}
                    min={0}
                    max={5}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>FLEX</FormLabel>
                  <NumberInput
                    value={config.roster_positions.flex}
                    onChange={(valueAsString) => updateRosterPosition('flex', valueAsString)}
                    min={0}
                    max={5}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>K</FormLabel>
                  <NumberInput
                    value={config.roster_positions.k}
                    onChange={(valueAsString) => updateRosterPosition('k', valueAsString)}
                    min={0}
                    max={3}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>D/ST</FormLabel>
                  <NumberInput
                    value={config.roster_positions.dst}
                    onChange={(valueAsString) => updateRosterPosition('dst', valueAsString)}
                    min={0}
                    max={3}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Bench</FormLabel>
                  <NumberInput
                    value={config.roster_positions.bench}
                    onChange={(valueAsString) => updateRosterPosition('bench', valueAsString)}
                    min={0}
                    max={15}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </Grid>

              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Total roster spots: {totalRosterSpots}
                </Text>
              </Alert>
            </VStack>
          </GridItem>
        </Grid>

        <HStack justify="center" spacing={4}>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Creating..."
          >
            Create Draft Configuration
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default SimpleDraftConfiguration;