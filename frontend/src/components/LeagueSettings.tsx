import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Heading,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  Text,
  Select,
  HStack,
  Button,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { ScoringType, DraftType, DraftConfigurationCreate } from '../types/draftConfig';

interface LeagueSettingsProps {
  config: DraftConfigurationCreate;
  onConfigChange: (config: DraftConfigurationCreate) => void;
  primaryColor: string;
  accentColor: string;
}

const LeagueSettings: React.FC<LeagueSettingsProps> = ({
  config,
  onConfigChange,
  primaryColor,
  accentColor
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const updateConfig = (updates: Partial<DraftConfigurationCreate>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
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
                onChange={(value) => updateConfig({ scoring_type: value as ScoringType })}
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
                onChange={(value) => updateConfig({ draft_type: value as DraftType })}
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
                onChange={(e) => updateConfig({ num_teams: parseInt(e.target.value) })}
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
                  onChange={(e) => updateConfig({ draft_position: parseInt(e.target.value) })}
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
                    updateConfig({ draft_position: randomPosition });
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
  );
};

export default LeagueSettings;