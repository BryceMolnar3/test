import React, { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Spinner } from '@chakra-ui/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import NavigationBar from '../../components/NavigationBar.tsx';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext.tsx';

interface LocationState {
  verseNumber?: number;
  verseText?: string;
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

// API base URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function VerseId() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verseNumber: verseNumberParam } = useParams();
  const { settings } = useDisplaySettings();
  const locationState = location.state as LocationState;
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get verse number from either URL param or location state
  const verseNumber = verseNumberParam ? parseInt(verseNumberParam) : locationState?.verseNumber;

  // Theme-based colors
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';
  const linkColor = settings.theme === 'dark' ? 'blue.300' : 'blue.600';

  useEffect(() => {
    async function fetchManuscripts() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/documents/`);
        if (!response.ok) {
          throw new Error('Failed to fetch manuscripts');
        }
        const data = await response.json();
        
        // Transform manuscripts to ensure consistent verse format
        const transformedData = data.map((manuscript: any) => ({
          ...manuscript,
          verses: manuscript.verses.map((verse: any) => {
            // If verse is a tuple [number, text]
            if (Array.isArray(verse)) {
              return {
                verse_number: parseInt(verse[0]),
                verse_text: verse[1]
              };
            }
            // If verse is already an object {verse_number, verse_text}
            return verse;
          })
        }));
        
        setManuscripts(transformedData);
      } catch (error) {
        console.error('Error fetching manuscripts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchManuscripts();
  }, []);

  if (!verseNumber) {
    return <Box>No verse number provided</Box>;
  }

  if (isLoading) {
    return (
      <Box>
        <NavigationBar />
        <Flex justify="center" align="center" height="calc(100vh - 100px)">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <NavigationBar />
      <Box bg="#08004F" py={8} px={6}>
        <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Verse View</Heading>
      </Box>
      <Box p={6} ml={8}>
        <Heading size="lg" mb={4} color={textColor}>Verse {verseNumber}</Heading>
        {manuscripts
          .filter(manuscript => manuscript.verses.some(v => v.verse_number === verseNumber))
          .map((manuscript) => {
            const verse = manuscript.verses.find(v => v.verse_number === verseNumber);
            return (
              <Box key={manuscript._id} mb={6}>
                <Flex ml={6}>
                  <Heading 
                    size="md" 
                    mb={2} 
                    cursor="pointer"
                    color={linkColor}
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => {
                      navigate(`/manuscript-viewer/${manuscript.filename.replace('.docx', '')}`, {
                        state: { manuscriptId: manuscript.filename }
                      });
                    }}
                  >
                    {manuscript.filename.replace('.docx', '')}
                  </Heading>
                  <Text fontSize="lg" ml={4} color={textColor}>{verse?.verse_text}</Text>
                </Flex>
              </Box>
            );
        })}
      </Box>
    </Box>
  );
}

export default VerseId;
