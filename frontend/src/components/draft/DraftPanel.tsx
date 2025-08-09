import React from 'react';
import {
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue
} from '@chakra-ui/react';
import PlayerSearch from '../player/PlayerSearch';
import YourTeam from './YourTeam';
import {
  Player,
  MakePickRequest,
  DraftStateResponse
} from '../../types/draft';

interface DraftPanelProps {
  draftId: string;
  onPlayerSelect: (player: Player) => void;
  onMakePick?: (pickRequest: MakePickRequest) => void;
  canMakePick?: boolean;
  currentUserTeamId?: string;
  scoringType?: 'standard' | 'ppr' | 'half_ppr';
  refreshTrigger?: number;
  draftState?: DraftStateResponse | null;
}

const DraftPanel: React.FC<DraftPanelProps> = ({
  draftId,
  onPlayerSelect,
  onMakePick,
  canMakePick = false,
  currentUserTeamId,
  scoringType = 'ppr',
  refreshTrigger = 0,
  draftState = null
}) => {
  // Color scheme - consistent with app
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const primaryColor = 'purple';

  return (
    <Card bg={cardBg} shadow="sm" border="1px" borderColor={borderColor} w="100%" h="100%">
      <CardBody p={2} display="flex" flexDirection="column" h="100%">
        <Tabs 
          variant="enclosed" 
          colorScheme={primaryColor} 
          flex={1} 
          display="flex" 
          flexDirection="column"
          h="100%"
        >
          <TabList flexShrink={0}>
            <Tab>Available Players</Tab>
            <Tab>Your Team</Tab>
          </TabList>
          
          <TabPanels flex={1} display="flex" flexDirection="column" overflow="hidden">
            {/* Available Players Tab */}
            <TabPanel p={0} flex={1} display="flex" flexDirection="column" overflow="hidden">
              <PlayerSearch
                draftId={draftId}
                onPlayerSelect={onPlayerSelect}
                onMakePick={onMakePick}
                canMakePick={canMakePick}
                currentUserTeamId={currentUserTeamId}
                scoringType={scoringType}
                refreshTrigger={refreshTrigger}
              />
            </TabPanel>

            {/* Your Team Tab */}
            <TabPanel p={0} flex={1} display="flex" flexDirection="column" overflow="hidden">
              <YourTeam
                draftId={draftId}
                draftState={draftState}
                refreshTrigger={refreshTrigger}
                onPlayerSelect={onPlayerSelect}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default DraftPanel;