import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Heading,
  Flex,
  Text,
  Badge,
  Button,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { DraftConfigurationCreate } from '../types/draftConfig';

interface ConfigurationSummaryProps {
  config: DraftConfigurationCreate;
  totalRosterSpots: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  primaryColor: string;
  accentColor: string;
}

const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  config,
  totalRosterSpots,
  isSubmitting,
  onSubmit,
  primaryColor,
  accentColor
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
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
                  {config.draft_position}{config.draft_position === 1 ? 'st' : config.draft_position === 2 ? 'nd' : config.draft_position === 3 ? 'rd' : 'th'}
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
        onClick={onSubmit}
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
  );
};

export default ConfigurationSummary;