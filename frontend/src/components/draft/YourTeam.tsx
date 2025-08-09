import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import {
  Player,
  DraftStateResponse
} from '../../types/draft';
import { useDraftPlayerData, getUserDraftedPlayers } from '../../utils/draftPlayerData';

interface YourTeamProps {
  draftId: string;
  draftState: DraftStateResponse | null;
  refreshTrigger?: number;
  onPlayerSelect: (player: Player) => void;
}

interface RosterSlot {
  id: string;
  position: string;
  slotType: string;
  player?: Player & { pick_number: number; round_number: number };
}

const YourTeam: React.FC<YourTeamProps> = ({ 
  draftId, 
  draftState, 
  refreshTrigger = 0,
  onPlayerSelect 
}) => {

  // Color scheme - consistent with existing app
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Use shared player data hook (same pattern as DraftBoard)
  const playersData = useDraftPlayerData(draftId, draftState);

  // Get user's drafted players using shared utility
  const draftedPlayers = getUserDraftedPlayers(draftState, playersData);

  // Get roster positions from draft session
  const getRosterPositions = () => {
    return draftState?.draft_session.roster_positions || {};
  };

  // Create individual roster slots with assignment logic
  const getRosterSlots = (): RosterSlot[] => {
    const rosterPositions = getRosterPositions();
    const slots: RosterSlot[] = [];

    // Create slots for each position
    Object.entries(rosterPositions).forEach(([position, count]) => {
      for (let i = 0; i < count; i++) {
        let slotType = position;
        // Handle special positions
        if (position !== 'FLEX' && position !== 'SUPERFLEX' && position !== 'BENCH') {
          slotType = 'STARTER';
        }

        slots.push({
          id: `${position}-${i}`,
          position: position.toUpperCase(),
          slotType
        });
      }
    });

    // Sort slots: starters first, then flex, then superflex, then bench
    const sortedSlots = slots.sort((a, b) => {
      const order: Record<string, number> = { 'STARTER': 1, 'FLEX': 2, 'SUPERFLEX': 3, 'BENCH': 4 };
      return order[a.slotType] - order[b.slotType];
    });

    // Assign players to slots
    sortedSlots.forEach(slot => {
      // Find the first player that matches this slot and is not already assigned
      const availablePlayer = draftedPlayers.find(player => {
        // Check if player matches slot position
        let matchesPosition = false;
        if (slot.position === 'FLEX') {
          matchesPosition = ['RB', 'WR', 'TE'].includes(player.position);
        } else if (slot.position === 'SUPERFLEX') {
          matchesPosition = ['QB', 'RB', 'WR', 'TE'].includes(player.position);
        } else if (slot.position === 'BENCH') {
          matchesPosition = true;
        } else {
          matchesPosition = player.position === slot.position;
        }
        
        // Check if player is not already assigned to a previous slot
        const isAlreadyAssigned = sortedSlots.some(otherSlot => 
          otherSlot.player && otherSlot.player.id === player.id
        );
        return matchesPosition && !isAlreadyAssigned;
      });
      if (availablePlayer) {
        slot.player = availablePlayer;
      }
    });

    return sortedSlots;
  };

  // No need for complex data fetching - backend provides pick.player data directly!

  const handlePlayerClick = (player: Player) => {
    onPlayerSelect(player);
  };

  const rosterSlots = getRosterSlots();

  return (
    <Box 
      h="100%" 
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        },
      }}
    >
      <VStack spacing={2} p={4} align="stretch">
        {/* Roster Slots */}
        {rosterSlots.map(slot => {

          return (
            <Card 
              key={slot.id} 
              bg={cardBg} 
              border="1px" 
              borderColor={borderColor}
              cursor={slot.player ? 'pointer' : 'default'}
              onClick={() => slot.player && handlePlayerClick(slot.player)}
              _hover={slot.player ? { transform: 'scale(1.01)', shadow: 'md' } : {}}
              transition="all 0.2s"
            >
            <CardBody p={3}>
              <HStack spacing={3}>
                {/* Position Badge */}
                <Badge
                  colorScheme={
                    slot.position === 'QB' || slot.position === 'SUPERFLEX' ? 'red' :
                    slot.position === 'RB' || slot.position === 'FLEX' ? 'green' :
                    slot.position === 'WR' ? 'blue' :
                    slot.position === 'TE' ? 'purple' :
                    slot.position === 'K' ? 'orange' :
                    slot.position === 'BENCH' ? 'gray' : 'gray'
                  }
                  size="sm"
                  minW="60px"
                  textAlign="center"
                >
                  {slot.position}
                </Badge>

                {/* Player Info */}
                <Box flex={1}>
                  {(() => {
                    return slot.player ? (
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {slot.player.player_name}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            size="xs"
                            colorScheme={
                              slot.player.position === 'QB' ? 'red' :
                              slot.player.position === 'RB' ? 'green' :
                              slot.player.position === 'WR' ? 'blue' :
                              slot.player.position === 'TE' ? 'purple' :
                              slot.player.position === 'K' ? 'orange' : 'gray'
                            }
                          >
                            {slot.player.position}
                          </Badge>
                          <Text fontSize="xs" color="gray.600">
                            {slot.player.team}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Pick {slot.player.pick_number}
                          </Text>
                        </HStack>
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Empty
                      </Text>
                    );
                  })()}
                </Box>
              </HStack>
            </CardBody>
          </Card>
          );
        })}

        {/* Empty State */}
        {getRosterSlots().length === 0 && (
          <Box p={8} textAlign="center">
            <Text color="gray.500">
              No roster data available
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default YourTeam;