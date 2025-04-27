import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Select,
  HStack,
  Text,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';
import { collationService } from '../services/collationService.ts';
import PhylogeneticTree from '../components/PhylogeneticTree.tsx';

function PhylogeneticTreePage() {
  const { settings } = useDisplaySettings();
  const [treeData, setTreeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'base64' | 'newick'>('base64');
  const toast = useToast();

  useEffect(() => {
    async function fetchTree() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await collationService.getPhylogeneticTree(format);
        
        if (format === 'base64' && data.tree_image) {
          // For base64 image format
          setTreeData({
            name: 'Phylogenetic Tree',
            children: [{
              name: 'Tree Image',
              attributes: {
                image: `data:image/png;base64,${data.tree_image}`
              }
            }]
          });
        } else if (format === 'newick' && data.newick_tree) {
          // For Newick format, we'll need to parse it into a tree structure
          // This is a placeholder - you'll need to implement Newick parsing
          setTreeData({
            name: 'Phylogenetic Tree',
            children: [{
              name: 'Newick Tree',
              attributes: {
                newick: data.newick_tree
              }
            }]
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch phylogenetic tree');
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTree();
  }, [format, toast]);

  if (isLoading) {
    return (
      <Box>
        <NavigationBar />
        <Box p={8} textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Loading phylogenetic tree...</Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <NavigationBar />
        <Box p={8}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <NavigationBar />
      <Box p={8}>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Phylogenetic Tree</Heading>
        </Box>

        <Box mt={8}>
          <HStack spacing={4} mb={4}>
            <Text>Tree Format:</Text>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'base64' | 'newick')}
              width="200px"
            >
              <option value="base64">Image</option>
              <option value="newick">Newick</option>
            </Select>
          </HStack>

          {treeData && (
            <Box
              borderWidth={1}
              borderColor={settings.theme === 'dark' ? 'gray.600' : 'gray.200'}
              borderRadius="lg"
              p={4}
              bg={settings.theme === 'dark' ? 'gray.800' : 'white'}
            >
              <PhylogeneticTree data={treeData} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default PhylogeneticTreePage; 