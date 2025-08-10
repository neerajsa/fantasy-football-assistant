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
  Heading
} from '@chakra-ui/react';
import { RepeatIcon, ArrowForwardIcon, EditIcon } from '@chakra-ui/icons';
import { DraftStatus, DraftSession, DraftTeam } from '../../types/draft';
import { useAppTheme } from '../../utils/theme';

interface DraftHeaderProps {
  draftSession: DraftSession;
  currentTeam: DraftTeam;
  isUserTurn: boolean;
  onStartDraft: () => void;
  isSkippingToUser?: boolean;
  onSkipToUser?: () => void;
  canUndoUserPick?: boolean;
  canSkipToUser?: boolean;
  onUndoUserPick?: () => void;
  isAutoDrafting?: boolean;
  canToggleAutoDraft?: boolean;
  onToggleAutoDraft?: () => void;
}

const DraftHeader: React.FC<DraftHeaderProps> = ({
  draftSession,
  currentTeam,
  isUserTurn,
  onStartDraft,
  isSkippingToUser = false,
  onSkipToUser,
  canUndoUserPick = false,
  canSkipToUser = false,
  onUndoUserPick,
  isAutoDrafting = false,
  canToggleAutoDraft = false,
  onToggleAutoDraft
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
                  <VStack spacing={1}>
                    <Badge colorScheme={colors.accent} fontSize="md" p={2}>
                      YOUR TURN
                    </Badge>
                    {isAutoDrafting && (
                      <Badge colorScheme="green" fontSize="xs" variant="solid">
                        AUTO DRAFTING
                      </Badge>
                    )}
                  </VStack>
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

          {/* Draft Controls */}
          <VStack align="end" spacing={2} minW="280px">
            <HStack spacing={2} wrap="wrap" justify="flex-end">
              {/* Undo User Pick Button */}
              {draftSession.status === DraftStatus.IN_PROGRESS && onUndoUserPick && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  colorScheme="orange"
                  onClick={onUndoUserPick}
                  isDisabled={!canUndoUserPick}
                  leftIcon={<RepeatIcon />}
                  _hover={{ 
                    transform: canUndoUserPick ? 'translateY(-1px)' : 'none',
                    boxShadow: canUndoUserPick ? 'md' : 'none',
                    borderColor: canUndoUserPick ? 'orange.400' : 'gray.300'
                  }}
                  transition="all 0.2s"
                  opacity={canUndoUserPick ? 1 : 0.6}
                  cursor={canUndoUserPick ? 'pointer' : 'not-allowed'}
                >
                  Undo Pick
                </Button>
              )}
              
              {/* Skip to User Pick Button */}
              {draftSession.status === DraftStatus.IN_PROGRESS && onSkipToUser && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  colorScheme={colors.primary}
                  onClick={onSkipToUser}
                  isDisabled={!canSkipToUser || isSkippingToUser}
                  leftIcon={<ArrowForwardIcon />}
                  loadingText="Skipping..."
                  isLoading={isSkippingToUser}
                  _hover={{ 
                    transform: canSkipToUser && !isSkippingToUser ? 'translateY(-1px)' : 'none',
                    boxShadow: canSkipToUser && !isSkippingToUser ? 'md' : 'none',
                    borderColor: canSkipToUser && !isSkippingToUser ? `${colors.primary}.400` : 'gray.300'
                  }}
                  transition="all 0.2s"
                  opacity={canSkipToUser ? 1 : 0.6}
                  cursor={canSkipToUser && !isSkippingToUser ? 'pointer' : 'not-allowed'}
                >
                  {isSkippingToUser ? 'Skipping...' : 'Skip to Pick'}
                </Button>
              )}

              {/* Auto Draft Button */}
              {draftSession.status === DraftStatus.IN_PROGRESS && onToggleAutoDraft && (
                <Button 
                  size="sm" 
                  variant={isAutoDrafting ? "solid" : "outline"}
                  colorScheme={isAutoDrafting ? "green" : colors.accent}
                  onClick={onToggleAutoDraft}
                  isDisabled={!canToggleAutoDraft}
                  leftIcon={<EditIcon />}
                  _hover={{ 
                    transform: canToggleAutoDraft ? 'translateY(-1px)' : 'none',
                    boxShadow: canToggleAutoDraft ? 'md' : 'none',
                    borderColor: canToggleAutoDraft ? (isAutoDrafting ? 'green.400' : `${colors.accent}.400`) : 'gray.300'
                  }}
                  transition="all 0.2s"
                  opacity={canToggleAutoDraft ? 1 : 0.6}
                  cursor={canToggleAutoDraft ? 'pointer' : 'not-allowed'}
                >
                  {isAutoDrafting ? 'Stop Auto' : 'Auto Draft'}
                </Button>
              )}
            </HStack>
          </VStack>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default DraftHeader;