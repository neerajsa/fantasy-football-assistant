import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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

const DraftConfiguration: React.FC = () => {
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

  const updateRosterPosition = (position: keyof RosterPositions, value: number) => {
    setConfig(prev => ({
      ...prev,
      roster_positions: {
        ...prev.roster_positions,
        [position]: value
      }
    }));
  };

  const totalRosterSpots = Object.values(config.roster_positions).reduce((sum, count) => sum + count, 0);

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        <Heading as="h2" size="xl" textAlign="center" color="blue.600">
          Configure Your Draft
        </Heading>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
          <GridItem>
            <VStack spacing={6} align="stretch">
              <Box>
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
              </Box>

              <Box>
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
              </Box>

              <Box>
                <FormControl>
                  <FormLabel>Number of Teams</FormLabel>
                  <NumberInput
                    value={config.num_teams}
                    onChange={(_, value) => setConfig(prev => ({ ...prev, num_teams: value }))}
                    min={4}
                    max={32}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Box>

              <Box>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Random Draft Position</FormLabel>
                  <Switch
                    isChecked={useRandomPosition}
                    onChange={(e) => setUseRandomPosition(e.target.checked)}
                  />
                </FormControl>
                
                {!useRandomPosition && (
                  <FormControl mt={4}>
                    <FormLabel>Draft Position</FormLabel>
                    <NumberInput
                      value={config.draft_position || 1}
                      onChange={(_, value) => setConfig(prev => ({ ...prev, draft_position: value }))}
                      min={1}
                      max={config.num_teams}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                )}
              </Box>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Heading as="h3" size="lg">Roster Positions</Heading>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl>
                  <FormLabel>QB</FormLabel>
                  <NumberInput
                    value={config.roster_positions.qb}
                    onChange={(_, value) => updateRosterPosition('qb', value)}
                    min={0}
                    max={5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>RB</FormLabel>
                  <NumberInput
                    value={config.roster_positions.rb}
                    onChange={(_, value) => updateRosterPosition('rb', value)}
                    min={0}
                    max={10}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>WR</FormLabel>
                  <NumberInput
                    value={config.roster_positions.wr}
                    onChange={(_, value) => updateRosterPosition('wr', value)}
                    min={0}
                    max={10}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>TE</FormLabel>
                  <NumberInput
                    value={config.roster_positions.te}
                    onChange={(_, value) => updateRosterPosition('te', value)}
                    min={0}
                    max={5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>FLEX</FormLabel>
                  <NumberInput
                    value={config.roster_positions.flex}
                    onChange={(_, value) => updateRosterPosition('flex', value)}
                    min={0}
                    max={5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>K</FormLabel>
                  <NumberInput
                    value={config.roster_positions.k}
                    onChange={(_, value) => updateRosterPosition('k', value)}
                    min={0}
                    max={3}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>D/ST</FormLabel>
                  <NumberInput
                    value={config.roster_positions.dst}
                    onChange={(_, value) => updateRosterPosition('dst', value)}
                    min={0}
                    max={3}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Bench</FormLabel>
                  <NumberInput
                    value={config.roster_positions.bench}
                    onChange={(_, value) => updateRosterPosition('bench', value)}
                    min={0}
                    max={15}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
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

export default DraftConfiguration;