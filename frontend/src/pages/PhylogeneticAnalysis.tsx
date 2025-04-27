import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Button,
  HStack
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';
import { collationService } from '../services/collationService.ts';
import { API_BASE_URL } from '../config.ts';

function PhylogeneticAnalysis() {
  const { settings } = useDisplaySettings();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTreeImage() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/generate_phylogenetic_tree/?format2=base64`);
        if (!response.ok) {
          let data = {};
          try {
            data = await response.json();
          } catch (e) {
            // ignore
          }
          const errorMsg = (data && typeof data === 'object' && 'error' in data) ? (data as any).error : response.statusText || 'Failed to fetch phylogenetic tree';
          throw errorMsg;
        }
        const data = await response.json();
        if (data.tree_image) {
          setImageSrc(`data:image/png;base64,${data.tree_image}`);
        } else {
          setImageSrc(null);
          setError('No image returned from backend.');
        }
      } catch (error) {
        // Log the error for debugging
        console.log('Error value:', error);
        setError(typeof error === 'string' ? error : (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsLoading(false);
      }
    }
    fetchTreeImage();
  }, [toast]);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.2));
  const handleZoomReset = () => setZoom(1);

  // Center the image in the scrollable area when zoom changes
  useEffect(() => {
    if (scrollRef.current && imageSrc) {
      const container = scrollRef.current;
      const img = container.querySelector('img');
      if (img) {
        // Center scroll on zoom reset
        if (zoom === 1) {
          container.scrollLeft = (img.clientWidth - container.clientWidth) / 2;
          container.scrollTop = (img.clientHeight - container.clientHeight) / 2;
        }
      }
    }
  }, [zoom, imageSrc]);

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
    let userMessage = error;
    if (
      error.includes("At least three manuscripts are required") ||
      error.toLowerCase().includes("not enough manuscripts")
    ) {
      userMessage =
        "Not enough manuscripts to generate a phylogenetic tree. Please add at least three non-draft manuscripts to the database.";
    }
    return (
      <Box>
        <NavigationBar />
        <Box p={8}>
          <Alert status="warning">
            <AlertIcon />
            {userMessage}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <NavigationBar />
      <Box bg="#08004F" py={8} px={6} position="relative">
        <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Phylogenetic Analysis</Heading>
      </Box>
      <Box p={8}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          {imageSrc && (
            <>
              <Box
                ref={scrollRef}
                style={{
                  overflow: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  background: settings.theme === 'dark' ? '#23263a' : '#fff',
                  padding: 8,
                  marginBottom: 16,
                  maxWidth: '90vw',
                  maxHeight: '75vh',
                  minHeight: 300,
                  minWidth: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={imageSrc}
                  alt="Phylogenetic Tree"
                  style={{
                    maxWidth: 'unset',
                    maxHeight: 'unset',
                    width: `calc(900px * ${zoom})`,
                    height: 'auto',
                    transform: `scale(1)`,
                    transition: 'width 0.2s',
                    display: 'block',
                  }}
                />
              </Box>
              <HStack spacing={4}>
                <Button onClick={handleZoomOut} borderRadius="full" size="md">-</Button>
                <Button onClick={handleZoomReset} borderRadius="full" size="md">Reset</Button>
                <Button onClick={handleZoomIn} borderRadius="full" size="md">+</Button>
              </HStack>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default PhylogeneticAnalysis; 