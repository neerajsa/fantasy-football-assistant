import React, { useState } from 'react';
import {
  Tr,
  Td,
  Badge,
  Button,
  Text,
  Box
} from '@chakra-ui/react';
import { Player } from '../types/draft';

interface PlayerRowProps {
  player: Player;
  canMakePick?: boolean;
  scoringType?: 'standard' | 'ppr' | 'half_ppr';
  onPlayerSelect: (player: Player) => void;
  onMakePick?: (player: Player) => void;
  hoverBg?: string;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  canMakePick,
  scoringType,
  onPlayerSelect,
  onMakePick,
  hoverBg = 'gray.50'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  // Get ADP value based on scoring type
  const getAdpValue = (player: Player): number | undefined => {
    switch (scoringType) {
      case 'standard':
        return player.adp_standard;
      case 'ppr':
        return player.adp_ppr;
      case 'half_ppr':
        return player.adp_half_ppr;
      default:
        return player.adp_ppr;
    }
  };

  // Get ECR rank based on scoring type
  const getEcrRank = (player: Player): number | undefined => {
    switch (scoringType) {
      case 'standard':
        return player.ecr_rank_standard;
      case 'ppr':
        return player.ecr_rank_ppr;
      case 'half_ppr':
        return player.ecr_rank_half_ppr;
      default:
        return player.ecr_rank_ppr;
    }
  };


  const adpValue = getAdpValue(player);
  const rankValue = getEcrRank(player);

  return (
    <Tr
      position="relative"
      cursor="pointer"
      onClick={() => onPlayerSelect(player)}
      _hover={{ bg: hoverBg }}
      transition="all 0.2s"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Td>
        <Badge
          colorScheme={
            (rankValue || 999) <= 50 ? 'green' :
            (rankValue || 999) <= 100 ? 'yellow' : 'gray'
          }
          variant="subtle"
        >
          {rankValue || '—'}
        </Badge>
      </Td>
      <Td>
        <Text fontWeight="semibold" fontSize="sm">
          {player.player_name}
        </Text>
      </Td>
      <Td>
        <Badge
          colorScheme={
            player.position === 'QB' ? 'red' :
            player.position === 'RB' ? 'green' :
            player.position === 'WR' ? 'blue' :
            player.position === 'TE' ? 'purple' :
            player.position === 'K' ? 'orange' : 'gray'
          }
          size="sm"
        >
          {player.position}
        </Badge>
      </Td>
      <Td>
        <Text fontSize="sm" fontWeight="medium">
          {player.team}
        </Text>
      </Td>
      <Td>
        <Text fontSize="sm">
          {adpValue?.toFixed(1) || '—'}
        </Text>
      </Td>
      
      {/* Hover Overlay with Draft Button over Rank */}
      {canMakePick && isHovered && (
        <Box
          position="absolute"
          top="0"
          left="0"
          bottom="0"
          width="80px"
          bg="rgba(0, 0, 0, 0.1)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={10}
          borderRadius="md"
        >
          <Button
            size="xs"
            fontSize="xs"
            colorScheme="green"
            shadow="lg"
            _hover={{ transform: 'scale(1.05)' }}
            onClick={(e) => {
              e.stopPropagation();
              onMakePick && onMakePick(player);
            }}
          >
            Draft
          </Button>
        </Box>
      )}
    </Tr>
  );
};

export default PlayerRow;