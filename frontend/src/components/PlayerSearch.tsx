import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PlayerRow from './PlayerRow';
import {
  Box,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Badge,
  Button,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Divider,
  useToast,
  Heading
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import {
  Player,
  PlayerSearchFilters,
  MakePickRequest
} from '../types/draft';
import { draftApi } from '../services/draftApi';

interface PlayerSearchProps {
  draftId: string;
  onPlayerSelect: (player: Player) => void;
  onMakePick?: (pickRequest: MakePickRequest) => void;
  canMakePick?: boolean;
  currentUserTeamId?: string;
  scoringType?: 'standard' | 'ppr' | 'half_ppr';
  refreshTrigger?: number;
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

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
  const borderColor = useColorModeValue('gray.200', 'gray.600');
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
    <Card bg={cardBg} shadow="sm" border="1px" borderColor={borderColor} w="100%" h="100%">
      <CardBody p={4} display="flex" flexDirection="column" h="100%">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="lg" color={`${primaryColor}.600`} fontWeight="bold">
            Available Players
          </Heading>
          <Badge colorScheme={accentColor} size="sm">
            {players.length} players
          </Badge>
        </Flex>
        {/* Search and Filter Controls */}
        <VStack spacing={4} mb={4}>
          {/* Search and Position Filter */}
          <HStack w="full" spacing={3}>
            <InputGroup flex={2}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search players or teams..."
                value={filters.search_text || ''}
                onChange={(e) => handleFilterChange('search_text', e.target.value)}
              />
            </InputGroup>
            
            <Select
              flex={1}
              placeholder="All Positions"
              value={filters.position || ''}
              onChange={(e) => handleFilterChange('position', e.target.value || undefined)}
            >
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </Select>
          </HStack>

          {/* Rank Range Filter */}
          <HStack w="full" spacing={3}>
            <Text fontSize="sm" color="gray.600" minW="80px">
              ECR Range:
            </Text>
            <NumberInput
              size="sm"
              min={1}
              max={500}
              value={filters.min_rank || ''}
              onChange={(valueString) => 
                handleFilterChange('min_rank', valueString ? parseInt(valueString) : undefined)
              }
            >
              <NumberInputField placeholder="Min" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            
            <Text>to</Text>
            
            <NumberInput
              size="sm"
              min={1}
              max={500}
              value={filters.max_rank || ''}
              onChange={(valueString) => 
                handleFilterChange('max_rank', valueString ? parseInt(valueString) : undefined)
              }
            >
              <NumberInputField placeholder="Max" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>

            <Button 
              size="sm" 
              variant="outline" 
              colorScheme={primaryColor} 
              onClick={clearFilters}
            >
              Clear
            </Button>
          </HStack>

        </VStack>

        <Divider mb={4} />

        {/* Error Alert */}
        {error && (
          <Alert status="error" mb={4} size="sm" borderRadius="md">
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
      </CardBody>
    </Card>
  );
};

export default PlayerSearch;