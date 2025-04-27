import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Select,
  Progress,
  VStack,
  HStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';
import { collationService } from '../services/collationService.ts';
import { API_BASE_URL } from '../config.ts';

// Types for API responses and requests
interface WordComparison {
  verseNumber: number;
  word1: string;
  word2: string;
  position: number;
  manuscriptSigla: string;
}

interface ComparisonResult {
  comparisonId: string;
  isSignificant: boolean;
  variationType: string;
  wordComparison: WordComparison;
  timestamp: string;
}

interface CollationResult {
  differences: {
    [verseNumber: string]: {
      witnesses?: string[];
      table?: any[][];
      error?: string;
    };
  };
  witness_maps?: {
    [verseNumber: string]: {
      [witness: string]: string;
    };
  };
}

interface Manuscript {
  _id: string;
  filename: string;
  metadata: {
    'MS ID:': string;
    'Other Names:': string;
    'Contents:': string;
    'Date:': string;
    'Origin:': string;
    'Total Folia:': string;
    'Dimensions:': string;
    'Materials:': string;
    'Laod. Folia:': string;
    'Format Description:': string;
  };
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
}

// Default variation types
const defaultVariationTypes = [
  "Different Spelling",
  "Abbreviation",
  "Word Choice",
  "Word Order",
  "Addition",
  "Omission"
];

function ManualDifferentiation() {
  const { settings } = useDisplaySettings();
  const [variations, setVariations] = useState<WordComparison[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isSignificant, setIsSignificant] = useState(true);
  const [variationType, setVariationType] = useState('Different Spelling');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [variationTypes, setVariationTypes] = useState<string[]>(defaultVariationTypes);
  const [collationResults, setCollationResults] = useState<CollationResult | null>(null);
  const [skippedIndices, setSkippedIndices] = useState<number[]>([]);
  const toast = useToast();

  // Color mode values
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const boxBorderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.200';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.600';
  const inputBg = settings.theme === 'dark' ? 'gray.700' : 'gray.50';
  const inputBorderColor = settings.theme === 'dark' ? 'gray.500' : 'gray.300';

  // Load variation types on mount
  useEffect(() => {
    const savedTypes = localStorage.getItem('variationTypes');
    if (savedTypes) {
      try {
        const types = JSON.parse(savedTypes);
        setVariationTypes(types);
        if (!types.includes(variationType)) {
          setVariationType(types[0]);
        }
      } catch (error) {
        console.error('Error loading variation types:', error);
      }
    }
  }, [variationType]);

  // Fetch collation results on component mount
  useEffect(() => {
    async function fetchCollation() {
      try {
        setIsFetchingData(true);
        setError(null);
        const data = await collationService.collateManuscripts();
        setCollationResults(data);
        
        console.log('Raw collation API response:', data);
        const newVariations: WordComparison[] = [];
        const witnessMaps = (data as any).witness_maps ? (data as any).witness_maps : {};
        Object.entries(data.differences).forEach(([verseNumber, differenceList]) => {
          if (!Array.isArray(differenceList)) return;
          differenceList.forEach(diff => {
            if (diff.differences && diff.differences.w1 !== undefined && diff.differences.w2 !== undefined) {
              // Use witness_maps to get the correct sigla for w2
              let manuscriptSigla = 'w2';
              const witnessMap = witnessMaps[verseNumber];
              if (witnessMap && witnessMap['w2']) {
                manuscriptSigla = witnessMap['w2'].replace('.docx', '');
              }
              newVariations.push({
                verseNumber: parseInt(verseNumber),
                word1: diff.differences.w1,
                word2: diff.differences.w2,
                position: diff.position,
                manuscriptSigla: manuscriptSigla
              });
            }
          });
        });
        console.log('Final newVariations:', newVariations);
        setVariations(newVariations);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch collation results');
        toast({
          title: 'Error fetching collation results',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsFetchingData(false);
      }
    }

    fetchCollation();
  }, [toast]);

  const currentVariation = variations[currentIndex];
  const currentNumber = currentIndex + 1;
  const totalVariations = variations.length;

  async function handleConfirm() {
    if (!currentVariation) return;

    try {
      setIsLoading(true);
      setError(null);

      // Save the comparison result
      await collationService.saveComparison({
        wordComparison: currentVariation,
        isSignificant,
        variationType,
      });

      setCompletedCount(prev => prev + 1);
      if (currentIndex < variations.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }

      toast({
        title: 'Comparison saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save comparison');
      toast({
        title: 'Error saving comparison',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    if (currentIndex < variations.length - 1) {
      setSkippedIndices(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }
  }

  function handleGoBackToPreviousSkipped() {
    if (skippedIndices.length > 0) {
      const lastSkipped = skippedIndices[skippedIndices.length - 1];
      setSkippedIndices(prev => prev.slice(0, -1));
      setCurrentIndex(lastSkipped);
    }
  }

  if (isFetchingData) {
    return (
      <Box>
        <NavigationBar />
        <Box>
          <Box bg="#08004F" py={8} px={6} position="relative">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manual Differentiation</Heading>
          </Box>
          <Box p={8} textAlign="center">
            <Spinner size="xl" />
            <Text mt={4} color={textColor}>Loading comparisons...</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <NavigationBar />
        <Box>
          <Box bg="#08004F" py={8} px={6} position="relative">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manual Differentiation</Heading>
          </Box>
          <Box p={8}>
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!currentVariation) {
    return (
      <Box>
        <NavigationBar />
        <Box>
          <Box bg="#08004F" py={8} px={6} position="relative">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manual Differentiation</Heading>
          </Box>
          <Box p={8} textAlign="center">
            <Text fontSize="xl">All variations have been processed.</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manual Differentiation</Heading>
        </Box>

        <Box p={8} maxW="800px" mx="auto">
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Text fontSize="2xl" mb={4} color={textColor}>
                {currentNumber} out of {totalVariations} variations completed
              </Text>
              <Progress 
                value={(currentNumber / totalVariations) * 100} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full"
              />
            </Box>

            {/* Go Back to Previous Skipped Button */}
            {skippedIndices.length > 0 && (
              <Button
                colorScheme="yellow"
                onClick={handleGoBackToPreviousSkipped}
                borderRadius="full"
                mb={4}
              >
                Go Back to Previous Skipped
              </Button>
            )}

            <Box 
              borderWidth={1} 
              borderColor={boxBorderColor}
              borderRadius="lg" 
              p={8}
              bg={boxBg}
              boxShadow="sm"
            >
              <VStack spacing={6} align="stretch">
                <HStack spacing={4} justify="center">
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>01</Text>
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>vs.</Text>
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>{currentVariation.manuscriptSigla}</Text>
                </HStack>

                <Text textAlign="center" fontSize="md" color={textColor}>
                  Verse {currentVariation.verseNumber}, Word {currentVariation.position}
                </Text>

                <VStack spacing={4}>
                  <Box 
                    w="100%" 
                    p={4} 
                    borderWidth={1} 
                    borderColor={inputBorderColor}
                    borderRadius="md"
                    textAlign="center"
                    bg={inputBg}
                  >
                    <Text fontSize="xl" color={textColor}>{currentVariation.word1}</Text>
                    <Text fontSize="sm" color={textColor} mt={1}>Manuscript 01</Text>
                  </Box>
                  
                  <Text fontSize="lg" color={textColor}>vs.</Text>
                  
                  <Box 
                    w="100%" 
                    p={4} 
                    borderWidth={1} 
                    borderColor={inputBorderColor}
                    borderRadius="md"
                    textAlign="center"
                    bg={inputBg}
                  >
                    <Text fontSize="xl" color={textColor}>{currentVariation.word2}</Text>
                    <Text fontSize="sm" color={textColor} mt={1}>Manuscript {currentVariation.manuscriptSigla}</Text>
                  </Box>
                </VStack>

                <Box>
                  <HStack spacing={0} mb={6}>
                    <Button
                      flex={1}
                      bg={isSignificant ? "green.500" : settings.theme === 'dark' ? "gray.700" : "gray.200"}
                      color={isSignificant ? "white" : textColor}
                      onClick={() => setIsSignificant(true)}
                      _hover={{ bg: isSignificant ? "green.600" : settings.theme === 'dark' ? "gray.600" : "gray.300" }}
                      borderRightRadius={0}
                      py={6}
                    >
                      Significant
                    </Button>
                    <Button
                      flex={1}
                      bg={!isSignificant ? "gray.500" : settings.theme === 'dark' ? "gray.700" : "gray.200"}
                      color={!isSignificant ? "white" : textColor}
                      onClick={() => setIsSignificant(false)}
                      _hover={{ bg: !isSignificant ? "gray.600" : settings.theme === 'dark' ? "gray.600" : "gray.300" }}
                      borderLeftRadius={0}
                      py={6}
                    >
                      Insignificant
                    </Button>
                  </HStack>

                  <Box mb={6}>
                    <Text mb={2} color={textColor}>Variation type</Text>
                    <Select
                      value={variationType}
                      onChange={(e) => setVariationType(e.target.value)}
                      size="lg"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      color={textColor}
                      _hover={{ borderColor: settings.theme === 'dark' ? "gray.400" : "gray.500" }}
                    >
                      {variationTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </Box>

                  <Flex gap={4} justify="space-between">
                    <Button
                      bg="#B8860B"
                      color="white"
                      _hover={{ bg: "#9A7B0A" }}
                      onClick={handleSkip}
                      size="lg"
                      px={8}
                      isDisabled={isLoading}
                      borderRadius="full"
                    >
                      Skip for later
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={handleConfirm}
                      size="lg"
                      px={12}
                      isLoading={isLoading}
                      loadingText="Confirming..."
                      borderRadius="full"
                    >
                      Confirm
                    </Button>
                  </Flex>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default ManualDifferentiation; 