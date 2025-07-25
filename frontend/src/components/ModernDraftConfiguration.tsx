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
  RadioGroup,
  Radio,
  Stack,
  Card,
  CardBody,
  Divider,
  Badge,
  useColorModeValue,
  Flex,
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
  const toast = useToast();

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const primaryColor = 'purple';
  const accentColor = 'teal';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await draftConfigApi.createDraftConfiguration(config);
      
      if (response.success) {
        toast({
          title: 'Draft Configuration Created!',
          description: `Your draft position is ${response.data?.draft_position}. Ready to start your mock draft.`,
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
            <Card bg={cardBg} shadow="sm" border="1px" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Heading as="h3" size="md" color={`${primaryColor}.600`}>
                    League Settings
                  </Heading>
                  
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                    {/* League Type - Static for now */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                        League Type
                      </FormLabel>
                      <RadioGroup value="2025">
                        <Stack>
                          <Radio value="2025" colorScheme={primaryColor}>
                            <Text fontSize="sm">2025 Season</Text>
                          </Radio>
                          <Radio value="dynasty" isDisabled>
                            <Text fontSize="sm" color="gray.400">Dynasty</Text>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    {/* Scoring */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                        Scoring
                      </FormLabel>
                      <RadioGroup 
                        value={config.scoring_type}
                        onChange={(value) => setConfig(prev => ({ ...prev, scoring_type: value as ScoringType }))}
                        colorScheme={primaryColor}
                      >
                        <Stack spacing={3}>
                          <Radio value={ScoringType.STANDARD}>
                            <Text fontSize="sm">Standard</Text>
                          </Radio>
                          <Radio value={ScoringType.PPR}>
                            <Text fontSize="sm">PPR</Text>
                          </Radio>
                          <Radio value={ScoringType.HALF_PPR}>
                            <Text fontSize="sm">Half PPR</Text>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    {/* Draft Type */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                        Draft Type
                      </FormLabel>
                      <RadioGroup 
                        value={config.draft_type}
                        onChange={(value) => setConfig(prev => ({ ...prev, draft_type: value as DraftType }))}
                        colorScheme={primaryColor}
                      >
                        <Stack spacing={3}>
                          <Radio value={DraftType.SNAKE}>
                            <Text fontSize="sm">Snake</Text>
                          </Radio>
                          <Radio value={DraftType.LINEAR}>
                            <Text fontSize="sm">Linear</Text>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  <Divider />

                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    {/* Number of Teams */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                        # of Teams
                      </FormLabel>
                      <Select
                        value={config.num_teams}
                        onChange={(e) => setConfig(prev => ({ ...prev, num_teams: parseInt(e.target.value) }))}
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                        _focus={{ borderColor: `${primaryColor}.500`, boxShadow: `0 0 0 1px ${primaryColor}.500` }}
                      >
                        {Array.from({ length: 29 }, (_, i) => i + 4).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Draft Position */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                        Draft Position
                      </FormLabel>
                      <HStack spacing={3}>
                        <Select
                          value={config.draft_position || 1}
                          onChange={(e) => {
                            setConfig(prev => ({ ...prev, draft_position: parseInt(e.target.value) }));
                          }}
                          bg="white"
                          border="1px"
                          borderColor="gray.300"
                          _focus={{ borderColor: `${primaryColor}.500`, boxShadow: `0 0 0 1px ${primaryColor}.500` }}
                          flex="1"
                        >
                          {Array.from({ length: config.num_teams }, (_, i) => i + 1).map(pos => (
                            <option
                              key={pos}
                              value={pos}
                            >
                              {pos}{pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'}
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          colorScheme={accentColor}
                          onClick={() => {
                            const randomPosition = Math.floor(Math.random() * config.num_teams) + 1;
                            setConfig(prev => ({ ...prev, draft_position: randomPosition }));
                          }}
                          minW="80px"
                        >
                          Randomize
                        </Button>
                      </HStack>
                    </FormControl>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Roster Positions Card */}
            <Card bg={cardBg} shadow="sm" border="1px" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading as="h3" size="md" color={`${primaryColor}.600`}>
                      Roster Positions
                    </Heading>
                    <Badge colorScheme={accentColor} px={3} py={1} borderRadius="full">
                      Total: {totalRosterSpots} spots
                    </Badge>
                  </Flex>
                  
                  <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    {/* QB */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        QB
                      </FormLabel>
                      <Select
                        value={config.roster_positions.qb}
                        onChange={(e) => updateRosterPosition('qb', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* RB */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        RB
                      </FormLabel>
                      <Select
                        value={config.roster_positions.rb}
                        onChange={(e) => updateRosterPosition('rb', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* WR */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        WR
                      </FormLabel>
                      <Select
                        value={config.roster_positions.wr}
                        onChange={(e) => updateRosterPosition('wr', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* TE */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        TE
                      </FormLabel>
                      <Select
                        value={config.roster_positions.te}
                        onChange={(e) => updateRosterPosition('te', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* Flex */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        Flex
                      </FormLabel>
                      <Select
                        value={config.roster_positions.flex}
                        onChange={(e) => updateRosterPosition('flex', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* K */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        K
                      </FormLabel>
                      <Select
                        value={config.roster_positions.k}
                        onChange={(e) => updateRosterPosition('k', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* DST */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        DST
                      </FormLabel>
                      <Select
                        value={config.roster_positions.dst}
                        onChange={(e) => updateRosterPosition('dst', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>

                    {/* Bench */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                        Bench
                      </FormLabel>
                      <Select
                        value={config.roster_positions.bench}
                        onChange={(e) => updateRosterPosition('bench', e.target.value)}
                        size="sm"
                        bg="white"
                        border="1px"
                        borderColor="gray.300"
                      >
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Right Column - Summary & Actions */}
          <VStack spacing={6} align="stretch">
            
            {/* Summary Card */}
            <Card bg={cardBg} shadow="sm" border="1px" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading as="h3" size="sm" color={`${primaryColor}.600`}>
                    Configuration Summary
                  </Heading>
                  
                  <VStack spacing={3} align="stretch" fontSize="sm">
                    <Flex justify="space-between">
                      <Text color="gray.600">League Type:</Text>
                      <Text fontWeight="medium">2025 Season</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Teams:</Text>
                      <Text fontWeight="medium">{config.num_teams}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Scoring:</Text>
                      <Badge colorScheme={primaryColor} size="sm">
                        {config.scoring_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Draft Type:</Text>
                      <Badge colorScheme={accentColor} size="sm">
                        {config.draft_type.toUpperCase()}
                      </Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Draft Position:</Text>
                      <Text fontWeight="medium">
                        {config.draft_position ? `${config.draft_position}th` : '1st'}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color="gray.600">Roster Size:</Text>
                      <Text fontWeight="medium">{totalRosterSpots} players</Text>
                    </Flex>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Action Button */}
            <Button
              colorScheme={primaryColor}
              size="lg"
              height="60px"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Creating Draft..."
              fontSize="md"
              fontWeight="bold"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              Start Mock Draft
            </Button>

            {/* Additional Info */}
            <Alert status="info" borderRadius="md" fontSize="sm">
              <AlertIcon />
              <Text>
                Your draft configuration will be saved and you'll receive your assigned draft position.
              </Text>
            </Alert>
          </VStack>
        </Grid>
      </Box>
    </Box>
  );
};

export default ModernDraftConfiguration;