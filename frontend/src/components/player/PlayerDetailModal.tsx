import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import { Player, DraftStatus, MakePickRequest } from '../../types/draft';
import { getPlayerEcrRank, getPlayerAdp, getPlayerPreviousYearPoints } from '../../utils/playerUtils';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayer: Player | null;
  scoringType: string;
  draftStatus: DraftStatus;
  isPlayerDrafted: (player: Player) => boolean;
  isUserTurn: boolean;
  makingPick: boolean;
  onMakePick: (pickRequest: MakePickRequest) => Promise<void>;
}

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  selectedPlayer,
  scoringType,
  draftStatus,
  isPlayerDrafted,
  isUserTurn,
  makingPick,
  onMakePick
}) => {
  if (!selectedPlayer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {selectedPlayer.player_name} - {selectedPlayer.position} • {selectedPlayer.team}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Player Stats */}
            <Card>
              <CardBody>
                <Text fontSize="lg" fontWeight="bold" mb={3}>
                  Player Rankings & Stats
                </Text>
                
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>ECR Rank</StatLabel>
                    <StatNumber>
                      {getPlayerEcrRank(selectedPlayer, scoringType) || '—'}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>ADP</StatLabel>
                    <StatNumber>
                      {getPlayerAdp(selectedPlayer, scoringType)?.toFixed(1) || '—'}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>2023 Points</StatLabel>
                    <StatNumber>
                      {getPlayerPreviousYearPoints(selectedPlayer, scoringType)?.toFixed(1) || '—'}
                    </StatNumber>
                  </Stat>
                </Grid>
              </CardBody>
            </Card>

            {/* Draft Action or Already Drafted Info */}
            {isPlayerDrafted(selectedPlayer) ? (
              <Card>
                <CardBody>
                  <VStack spacing={3}>
                    <Text fontSize="lg" fontWeight="bold" color="gray.600">
                      Player Already Drafted
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      This player has already been selected by another team.
                    </Text>
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : isUserTurn && draftStatus === DraftStatus.IN_PROGRESS ? (
              <Card>
                <CardBody>
                  <VStack spacing={3}>
                    <Text fontSize="lg" fontWeight="bold">
                      Draft This Player?
                    </Text>
                    
                    <HStack spacing={3}>
                      <Button
                        colorScheme="green"
                        size="lg"
                        isLoading={makingPick}
                        loadingText="Drafting..."
                        onClick={() => onMakePick({ 
                          player_id: selectedPlayer.id, 
                          player_name: selectedPlayer.player_name 
                        })}
                      >
                        Draft {selectedPlayer.player_name}
                      </Button>
                      
                      <Button variant="outline" onClick={onClose}>
                        Keep Looking
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ) : null}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PlayerDetailModal;