import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Flex,
  Heading,
  Badge,
  Grid,
  FormControl,
  FormLabel,
  Select,
  useColorModeValue
} from '@chakra-ui/react';
import { RosterPositions } from '../../types/draftConfig';

interface RosterConfigurationProps {
  rosterPositions: RosterPositions;
  onUpdateRosterPosition: (position: keyof RosterPositions, value: string) => void;
  primaryColor: string;
  accentColor: string;
}

const RosterConfiguration: React.FC<RosterConfigurationProps> = ({
  rosterPositions,
  onUpdateRosterPosition,
  primaryColor,
  accentColor
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const totalRosterSpots = Object.values(rosterPositions).reduce((sum, count) => sum + count, 0);

  return (
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
          
          <Grid templateColumns="repeat(5, 1fr)" gap={4}>
            {/* QB */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                QB
              </FormLabel>
              <Select
                value={rosterPositions.qb}
                onChange={(e) => onUpdateRosterPosition('qb', e.target.value)}
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
                value={rosterPositions.rb}
                onChange={(e) => onUpdateRosterPosition('rb', e.target.value)}
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
                value={rosterPositions.wr}
                onChange={(e) => onUpdateRosterPosition('wr', e.target.value)}
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
                value={rosterPositions.te}
                onChange={(e) => onUpdateRosterPosition('te', e.target.value)}
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
                value={rosterPositions.flex}
                onChange={(e) => onUpdateRosterPosition('flex', e.target.value)}
                size="sm"
                bg="white"
                border="1px"
                borderColor="gray.300"
              >
                {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </FormControl>

            {/* Superflex */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                Superflex
              </FormLabel>
              <Select
                value={rosterPositions.superflex}
                onChange={(e) => onUpdateRosterPosition('superflex', e.target.value)}
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
                value={rosterPositions.k}
                onChange={(e) => onUpdateRosterPosition('k', e.target.value)}
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
                value={rosterPositions.dst}
                onChange={(e) => onUpdateRosterPosition('dst', e.target.value)}
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
                value={rosterPositions.bench}
                onChange={(e) => onUpdateRosterPosition('bench', e.target.value)}
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
  );
};

export default RosterConfiguration;