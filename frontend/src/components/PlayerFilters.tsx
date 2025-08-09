import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Button,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { PlayerSearchFilters } from '../types/draft';
import { useAppTheme } from '../utils/theme';

interface PlayerFiltersProps {
  filters: PlayerSearchFilters;
  onFilterChange: (key: keyof PlayerSearchFilters, value: any) => void;
  onClearFilters: () => void;
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

const PlayerFilters: React.FC<PlayerFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const { colors } = useAppTheme();

  return (
    <>
      {/* Search and Filter Controls */}
      <VStack spacing={4} mb={4} px={4} flexShrink={0}>
        {/* Search and Position Filter */}
        <HStack w="full" spacing={3}>
          <InputGroup flex={2}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search players or teams..."
              value={filters.search_text || ''}
              onChange={(e) => onFilterChange('search_text', e.target.value)}
            />
          </InputGroup>
          
          <Select
            flex={1}
            placeholder="All Positions"
            value={filters.position || ''}
            onChange={(e) => onFilterChange('position', e.target.value || undefined)}
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
              onFilterChange('min_rank', valueString ? parseInt(valueString) : undefined)
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
              onFilterChange('max_rank', valueString ? parseInt(valueString) : undefined)
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
            colorScheme={colors.primary} 
            onClick={onClearFilters}
          >
            Clear
          </Button>
        </HStack>
      </VStack>

      <Divider mb={4} />
    </>
  );
};

export default PlayerFilters;