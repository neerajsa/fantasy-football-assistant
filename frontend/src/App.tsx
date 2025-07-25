import React from 'react';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import SimpleDraftConfiguration from './components/SimpleDraftConfiguration';

function App() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4} color="blue.600">
            Fantasy Football Draft Assistant
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Your ultimate tool for dominating fantasy football drafts
          </Text>
        </Box>
        
        <SimpleDraftConfiguration />
      </VStack>
    </Container>
  );
}

export default App;
