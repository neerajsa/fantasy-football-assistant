import React from 'react';
import {
  Grid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Button,
  Heading,
  Box
} from '@chakra-ui/react';
import { DraftStatus, DraftSession, DraftTeam } from '../../types/draft';
import { useAppTheme } from '../../utils/theme';

interface DraftHeaderProps {
  draftSession: DraftSession;
  currentTeam: DraftTeam;
  isUserTurn: boolean;
  onStartDraft: () => void;
}

const DraftHeader: React.FC<DraftHeaderProps> = ({
  draftSession,
  currentTeam,
  isUserTurn,
  onStartDraft
}) => {
  const { colors } = useAppTheme();

  return (
    <Card mb={6} bg={colors.cardBg} shadow="sm" border="1px" borderColor={colors.borderColor}>
      <CardBody>
        <Grid templateColumns="1fr auto 1fr" gap={6} alignItems="center">
          {/* Draft Info */}
          <VStack align="start" spacing={2}>
            <HStack>
              <Heading as="h1" size="xl" color={`${colors.primary}.600`} fontWeight="bold">
                Mock Draft
              </Heading>
              <Badge
                colorScheme={
                  draftSession.status === DraftStatus.IN_PROGRESS ? 'green' :
                  draftSession.status === DraftStatus.COMPLETED ? 'blue' : 'gray'
                }
                fontSize="sm"
              >
                {draftSession.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </HStack>
            
            <HStack spacing={4}>
              <Badge colorScheme={colors.primary} size="sm">
                {draftSession.draft_type.toUpperCase()}
              </Badge>
              <Badge colorScheme={colors.accent} size="sm">
                {draftSession.scoring_type.replace('_', ' ').toUpperCase()}
              </Badge>
              <Text color="gray.600" fontSize="sm">
                {draftSession.num_teams} teams
              </Text>
            </HStack>
          </VStack>

          {/* Current Pick Status */}
          <VStack spacing={2}>
            <Text fontSize="lg" textAlign="center" color="gray.600">
              Round {draftSession.current_round} • Pick {draftSession.current_pick}
            </Text>
            
            {draftSession.status === DraftStatus.IN_PROGRESS ? (
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="bold" textAlign="center">
                  {currentTeam.team_name}
                </Text>
                {isUserTurn ? (
                  <Badge colorScheme={colors.accent} fontSize="md" p={2}>
                    YOUR TURN
                  </Badge>
                ) : (
                  <Badge colorScheme={colors.primary} fontSize="sm">
                    On the clock
                  </Badge>
                )}
              </VStack>
            ) : draftSession.status === DraftStatus.CREATED ? (
              <Button 
                colorScheme={colors.primary} 
                onClick={onStartDraft}
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

          {/* Placeholder for layout balance */}
          <Box minW="200px" />
        </Grid>
      </CardBody>
    </Card>
  );
};

export default DraftHeader;