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
  CardHeader,
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
  IconButton,
  Flex,
  Divider,
  useToast
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon } from '@chakra-ui/icons';
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
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

const PlayerSearch: React.FC<PlayerSearchProps> = ({
  draftId,
  onPlayerSelect,
  onMakePick,
  canMakePick = false,
  currentUserTeamId,
  scoringType = 'ppr'
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
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
  
  // Pagination state
  const [displayLimit, setDisplayLimit] = useState(50);

  const toast = useToast();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch available players
  const fetchPlayers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
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
      if (showRefreshing) setRefreshing(false);
    }
  }, [draftId, filters, toast]);

  // Initial load
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = draftApi.filterPlayers(players, filters);
    filtered = draftApi.sortPlayers(filtered, sortBy, sortAscending);
    return filtered.slice(0, displayLimit);
  }, [players, filters, sortBy, sortAscending, displayLimit]);

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
      await onMakePick({ player_id: player.id });
      
      toast({
        title: 'Pick made!',
        description: `Successfully drafted ${player.player_name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh player list
      fetchPlayers(true);
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
    <Card bg={cardBg} borderColor={borderColor}>
      <CardHeader pb={2}>
        <Flex justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Available Players ({players.length})
          </Text>
          <IconButton
            aria-label="Refresh players"
            icon={<RepeatIcon />}
            size="sm"
            onClick={() => fetchPlayers(true)}
            isLoading={refreshing}
          />
        </Flex>
      </CardHeader>

      <CardBody pt={2}>
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

            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </HStack>

          {/* Display Limit */}
          <HStack w="full" justify="space-between">
            <HStack>
              <Text fontSize="sm" color="gray.600">
                Show:
              </Text>
              <Select
                size="sm"
                w="100px"
                value={displayLimit}
                onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </Select>
            </HStack>

            {canMakePick && (
              <Badge colorScheme="green" p={2}>
                Click to draft
              </Badge>
            )}
          </HStack>
        </VStack>

        <Divider mb={4} />

        {/* Error Alert */}
        {error && (
          <Alert status="error" mb={4} size="sm">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {/* Players Table */}
        <Box overflowX="auto" maxH="600px" overflowY="auto">
          <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
              <Tr>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('rank')}
                  _hover={{ bg: hoverBg }}
                >
                  Rank {sortBy === 'rank' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('name')}
                  _hover={{ bg: hoverBg }}
                >
                  Player {sortBy === 'name' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('position')}
                  _hover={{ bg: hoverBg }}
                >
                  Pos {sortBy === 'position' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th>Team</Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSort('adp')}
                  _hover={{ bg: hoverBg }}
                >
                  ADP {sortBy === 'adp' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th>Points</Th>
                {canMakePick && <Th>Action</Th>}
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
              <Button mt={2} variant="link" onClick={clearFilters}>
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