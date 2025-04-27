import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Input,
  Button,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Select,
  Stack,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

// Define the Manuscript interface to match MongoDB structure
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

// Helper function to convert MongoDB manuscript to frontend format
function convertManuscript(mongoManuscript: any): Manuscript {
  return {
    _id: mongoManuscript._id,
    filename: mongoManuscript.filename,
    metadata: mongoManuscript.metadata,
    verses: mongoManuscript.verses.map(([number, text]: [string, string]) => ({
      verse_number: parseInt(number),
      verse_text: text
    }))
  };
}

// API base URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function sortManuscripts(manuscripts: Manuscript[], sortOption: SortOption): Manuscript[] {
  const sortedManuscripts = [...manuscripts];
  
  switch (sortOption) {
    case 'date-asc':
      return sortedManuscripts.sort((a, b) => {
        const yearA = parseInt(a.metadata['Date:'].match(/\d+/)?.[0] || '0');
        const yearB = parseInt(b.metadata['Date:'].match(/\d+/)?.[0] || '0');
        return yearA - yearB;
      });
    
    case 'date-desc':
      return sortedManuscripts.sort((a, b) => {
        const yearA = parseInt(a.metadata['Date:'].match(/\d+/)?.[0] || '0');
        const yearB = parseInt(b.metadata['Date:'].match(/\d+/)?.[0] || '0');
        return yearB - yearA;
      });

    case 'origin-az':
      return sortedManuscripts.sort((a, b) => 
        a.metadata['Origin:'].localeCompare(b.metadata['Origin:'])
      );

    case 'origin-za':
      return sortedManuscripts.sort((a, b) => 
        b.metadata['Origin:'].localeCompare(a.metadata['Origin:'])
      );

    case 'country-az':
      return sortedManuscripts.sort((a, b) => {
        const countryA = getCountryFromOrigin(a.metadata['Origin:']);
        const countryB = getCountryFromOrigin(b.metadata['Origin:']);
        
        const countryCompare = countryA.localeCompare(countryB);
        
        if (countryCompare === 0) {
          return a.metadata['Origin:'].localeCompare(b.metadata['Origin:']);
        }
        
        return countryCompare;
      });

    case 'country-za':
      return sortedManuscripts.sort((a, b) => {
        const countryA = getCountryFromOrigin(a.metadata['Origin:']);
        const countryB = getCountryFromOrigin(b.metadata['Origin:']);
        
        const countryCompare = countryB.localeCompare(countryA);
        
        if (countryCompare === 0) {
          return b.metadata['Origin:'].localeCompare(a.metadata['Origin:']);
        }
        
        return countryCompare;
      });
    
    case 'msid-az':
      return sortedManuscripts.sort((a, b) => 
        a.metadata['MS ID:'].localeCompare(b.metadata['MS ID:'])
      );

    case 'msid-za':
      return sortedManuscripts.sort((a, b) => 
        b.metadata['MS ID:'].localeCompare(a.metadata['MS ID:'])
      );

    case 'other-names-az':
      return sortedManuscripts.sort((a, b) => 
        a.metadata['Other Names:'].localeCompare(b.metadata['Other Names:'])
      );

    case 'other-names-za':
      return sortedManuscripts.sort((a, b) => 
        b.metadata['Other Names:'].localeCompare(a.metadata['Other Names:'])
      );
    
    case 'sigla-asc':
      return sortedManuscripts.sort((a, b) => 
        a.filename.localeCompare(b.filename)
      );
    
    case 'sigla-desc':
      return sortedManuscripts.sort((a, b) => 
        b.filename.localeCompare(a.filename)
      );
    
    default:
      return sortedManuscripts;
  }
}

// API service for manuscript operations
const manuscriptService = {
  async getAllManuscripts(): Promise<Manuscript[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch manuscripts: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching manuscripts:', error);
      throw error;
    }
  },

  async searchManuscripts(query: string): Promise<Manuscript[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/search/?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search manuscripts: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching manuscripts:', error);
      throw error;
    }
  },

  async deleteManuscript(filename: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${filename}/delete`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete manuscript: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting manuscript:', error);
      throw error;
    }
  },

  async getSortedManuscripts(manuscripts: Manuscript[], sortOption: SortOption): Promise<Manuscript[]> {
    try {
      // Since the backend doesn't support sorting yet, we'll do it client-side
      return sortManuscripts(manuscripts, sortOption);
    } catch (error) {
      console.error('Error sorting manuscripts:', error);
      throw error;
    }
  }
};

type SortOption = 'date-asc' | 'date-desc' | 'origin-az' | 'origin-za' | 'country-az' | 'country-za' | 
                  'sigla-asc' | 'sigla-desc' | 'msid-az' | 'msid-za' | 'other-names-az' | 'other-names-za';

function normalizeCountry(country: string): string {
  // Remove leading/trailing spaces and convert to lowercase for comparison
  const normalized = country.trim().toLowerCase();
  
  // Handle geographic indicators first
  if (normalized.includes('northern') || normalized.includes('southern') ||
      normalized.includes('eastern') || normalized.includes('western') ||
      normalized.includes('central')) {
    // Return the full normalized string since it likely contains important geographic context
    return normalized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Split into words and check if any word is a likely country name
  // Countries tend to be single words and longer than 3 letters
  const words = normalized.split(/[\s,]+/);
  const likelyCountry = words.find(word => 
    word.length > 3 && 
    !['the', 'and', 'near', 'region', 'province', 'city'].includes(word)
  );

  if (likelyCountry) {
    return likelyCountry.charAt(0).toUpperCase() + likelyCountry.slice(1);
  }
  
  // If no country detected, capitalize first letter of each word
  return country.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getCountryFromOrigin(origin: string): string {
  const parts = origin.split(',');
  let country;
  
  if (parts.length > 1) {
    // If there's a comma, use the last part (country)
    country = parts[parts.length - 1].trim();
  } else {
    // If no comma, check if it's a city we know the country for
    country = origin.trim();
  }
  
  return normalizeCountry(country);
}

function SearchDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('sigla-asc');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Load all manuscripts when component mounts
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);
        const manuscripts = await manuscriptService.getAllManuscripts();
        const sortedManuscripts = await manuscriptService.getSortedManuscripts(manuscripts, 'sigla-asc');
        setManuscripts(sortedManuscripts);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load manuscripts';
        setError(errorMessage);
        toast({
          title: 'Error loading manuscripts',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [toast]);

  async function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const sortOption = e.target.value as SortOption;
    setSortBy(sortOption);
    
    try {
      setIsLoading(true);
      setError(null);
      const sortedResults = await manuscriptService.getSortedManuscripts(manuscripts, sortOption);
      setManuscripts(sortedResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sort manuscripts';
      setError(errorMessage);
      toast({
        title: 'Error sorting manuscripts',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() && manuscripts.length === 0) {
      // If empty query and no results, load all manuscripts
      try {
        setIsLoading(true);
        setError(null);
        const manuscripts = await manuscriptService.getAllManuscripts();
        const sortedManuscripts = await manuscriptService.getSortedManuscripts(manuscripts, sortBy);
        setManuscripts(sortedManuscripts);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load manuscripts';
        setError(errorMessage);
        toast({
          title: 'Error loading manuscripts',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const results = await manuscriptService.searchManuscripts(searchQuery);
      const sortedResults = await manuscriptService.getSortedManuscripts(results, sortBy);
      setManuscripts(sortedResults);

      if (results.length === 0) {
        toast({
          title: 'No results found',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search manuscripts';
      setError(errorMessage);
      toast({
        title: 'Error searching manuscripts',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleViewManuscript(sigla: string) {
    navigate(`/manuscript-viewer/${sigla}`);
  }

  const handleDelete = async (filename: string) => {
    try {
      await manuscriptService.deleteManuscript(filename);
      // Refresh the manuscript list after deletion
      const updatedManuscripts = manuscripts.filter(m => m.filename !== filename);
      setManuscripts(updatedManuscripts);
    } catch (error) {
      console.error('Failed to delete manuscript:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Search Database</Heading>
        </Box>

        <Box p={8}>
          {error && (
            <Box mb={4} p={4} bg="red.50" color="red.600" borderRadius="md">
              {error}
            </Box>
          )}

          <Flex gap={4} mb={8} alignItems="flex-start">
            <Box flex={1}>
              <Input
                placeholder="Search by MS ID, Sigla, Other Names, Place of Origin, Date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
                borderColor="gray.400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </Box>
            <Box width="200px">
              <Select
                size="lg"
                value={sortBy}
                onChange={handleSort}
                borderColor="gray.400"
              >
                <option value="msid-az">MS ID (A-Z)</option>
                <option value="msid-za">MS ID (Z-A)</option>
                <option value="sigla-asc">Sigla (Ascending)</option>
                <option value="sigla-desc">Sigla (Descending)</option>
                <option value="other-names-az">Other Names (A-Z)</option>
                <option value="other-names-za">Other Names (Z-A)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="origin-az">City/Region (A-Z)</option>
                <option value="origin-za">City/Region (Z-A)</option>
                <option value="country-az">Country (A-Z)</option>
                <option value="country-za">Country (Z-A)</option>
              </Select>
            </Box>
            <Button
              bg="#08004F"
              color="white"
              _hover={{ bg: "#160082" }}
              onClick={handleSearch}
              size="lg"
              px={8}
              isLoading={isLoading}
              loadingText="Searching..."
              borderRadius="full"
            >
              Search
            </Button>
          </Flex>

          {manuscripts.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Sigla</Th>
                  <Th>MS ID</Th>
                  <Th>Other Names</Th>
                  <Th>Date</Th>
                  <Th>Origin</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {manuscripts.map((manuscript) => (
                  <Tr key={manuscript._id}>
                    <Td>{manuscript.filename.replace('.docx', '')}</Td>
                    <Td>{manuscript.metadata['MS ID:']}</Td>
                    <Td>{manuscript.metadata['Other Names:']}</Td>
                    <Td>{manuscript.metadata['Date:']}</Td>
                    <Td>{manuscript.metadata['Origin:']}</Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleViewManuscript(manuscript.filename.replace('.docx', ''))}
                        >
                          View
                        </Button>
                      </Stack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No manuscripts found</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default SearchDatabase; 