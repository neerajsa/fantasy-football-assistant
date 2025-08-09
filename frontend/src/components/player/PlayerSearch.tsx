import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PlayerRow from './PlayerRow';
import PlayerFilters from './PlayerFilters';
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  useToast,
  Heading
} from '@chakra-ui/react';
import {
  Player,
  PlayerSearchFilters,
  MakePickRequest
} from '../../types/draft';
import { draftApi } from '../../services/draftApi';

interface PlayerSearchProps {
  draftId: string;
  onPlayerSelect: (player: Player) => void;
  onMakePick?: (pickRequest: MakePickRequest) => void;
  canMakePick?: boolean;
  currentUserTeamId?: string;
  scoringType?: 'standard' | 'ppr' | 'half_ppr';
  refreshTrigger?: number;
}


const PlayerSearch: React.FC<PlayerSearchProps> = ({
  draftId,
  onPlayerSelect,
  onMakePick,
  canMakePick = false,
  currentUserTeamId,
  scoringType = 'ppr',
  refreshTrigger = 0
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<PlayerSearchFilters>({
    position: '',
    search_text: '',
    min_rank: undefined,
    max_rank: undefined
  });
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'rank' | 'adp' | 'name' | 'position'>('rank');
  const [sortAscending, setSortAscending] = useState(true);
  

  const toast = useToast();

  // Color scheme - consistent with configuration page
  const cardBg = useColorModeValue('white', 'gray.800');
  const primaryColor = 'purple';
  const accentColor = 'teal';
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch available players
  const fetchPlayers = useCallback(async () => {
    try {
      const response = await draftApi.getAvailablePlayers(draftId, filters, 500);
      setPlayers(response.players);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch players';
      setError(errorMessage);
      
      toast({
        title: 'Error loading players',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [draftId, filters, toast]);

  // Initial load
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Refresh when trigger changes (when draft state updates)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPlayers();
    }
  }, [refreshTrigger, fetchPlayers]);

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = draftApi.filterPlayers(players, filters);
    filtered = draftApi.sortPlayers(filtered, sortBy, sortAscending, scoringType);
    return filtered;
  }, [players, filters, sortBy, sortAscending, scoringType]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PlayerSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle sort changes
  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortAscending(!sortAscending);
    } else {
      setSortBy(newSortBy);
      setSortAscending(true);
    }
  };

  // Handle player selection
  const handlePlayerClick = (player: Player) => {
    onPlayerSelect(player);
  };

  // Handle making a pick
  const handleMakePick = async (player: Player) => {
    if (!onMakePick || !currentUserTeamId) return;

    try {
      await onMakePick({ player_id: player.id, player_name: player.player_name });

      // Refresh player list
      fetchPlayers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make pick';
      
      toast({
        title: 'Pick failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      position: '',
      search_text: '',
      min_rank: undefined,
      max_rank: undefined
    });
  };


  if (loading && players.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="lg" />
        <Text mt={2}>Loading available players...</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" h="100%" overflow="hidden">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4} px={4} pt={4} flexShrink={0}>
        <Heading as="h2" size="lg" color={`${primaryColor}.600`} fontWeight="bold">
          Available Players
        </Heading>
        <Badge colorScheme={accentColor} size="sm">
          {players.length} players
        </Badge>
      </Flex>
      {/* Search and Filter Controls */}
      <PlayerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={4} mx={4} size="sm" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      )}

      {/* Players Table */}
      <Box 
        flex={1} 
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
          <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
              <Tr>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('rank')}
                  _hover={{ bg: hoverBg }}
                  fontSize="xs"
                >
                  Rank {sortBy === 'rank' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('name')}
                  _hover={{ bg: hoverBg }}
                  fontSize="xs"
                >
                  Player {sortBy === 'name' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('position')}
                  _hover={{ bg: hoverBg }}
                  fontSize="xs"
                >
                  Pos {sortBy === 'position' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th fontSize="xs">Team</Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('adp')}
                  _hover={{ bg: hoverBg }}
                  fontSize="xs"
                >
                  ADP {sortBy === 'adp' && (sortAscending ? '↑' : '↓')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredAndSortedPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  canMakePick={canMakePick}
                  scoringType={scoringType}
                  onPlayerSelect={handlePlayerClick}
                  onMakePick={handleMakePick}
                  hoverBg={hoverBg}
                />
              ))}
            </Tbody>
          </Table>

          {filteredAndSortedPlayers.length === 0 && !loading && (
            <Box p={8} textAlign="center">
              <Text color="gray.500">
                No players found matching your criteria
              </Text>
              <Button 
                mt={2} 
                variant="link" 
                colorScheme={primaryColor} 
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </Box>
          )}
      </Box>
    </Box>
  );
};

export default PlayerSearch;