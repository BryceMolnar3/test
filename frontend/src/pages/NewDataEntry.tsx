import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Input, 
  Textarea, 
  Button,
  VStack,
  HStack,
  Image,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';

// API base URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface Draft {
  _id: string;
  filename: string;
  image_filename?: string;
  metadata: {
    'MS ID:': string;
    'Other Names:': string;
    'Contents:': string;
    'Date:': string;
    'Origin:': string;
    'Total Folia:': string;
    'Dimensions:': string;
    'Materials:': string;
    'Laod Folia:': string;
    'Format Description:': string;
  };
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
}

function NewDataEntry() {
  const [formData, setFormData] = useState({
    ms_id: '',
    sigla: '',
    date: '',
    other_names: '',
    contents: '',
    place_of_origin: '',
    total_folia: '',
    dimensions: '',
    materials: '',
    laod_folia: '',
    format_description: '',
    transcription: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [existingDraft, setExistingDraft] = useState<Draft | null>(null);
  const { isOpen: isDraftModalOpen, onOpen: onDraftModalOpen, onClose: onDraftModalClose } = useDisclosure();
  const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();
  const [currentImageError, setCurrentImageError] = useState(false);
  const [currentModalImageError, setCurrentModalImageError] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Fetch drafts on component mount
  useEffect(() => {
    fetchDrafts();
  }, []);

  async function fetchDrafts() {
    try {
      setIsLoadingDrafts(true);
      const response = await fetch(`${API_BASE_URL}/api/documents/drafts/`);
      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }
      const data = await response.json();
      setDrafts(data);
    } catch (error) {
      toast({
        title: 'Error fetching drafts',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDrafts(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(function(prev) {
      return {
        ...prev,
        [name]: value
      };
    });
  }

  function handleImageClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = function(e) {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleClear() {
    setFormData({
      ms_id: '',
      sigla: '',
      date: '',
      other_names: '',
      contents: '',
      place_of_origin: '',
      total_folia: '',
      dimensions: '',
      materials: '',
      laod_folia: '',
      format_description: '',
      transcription: ''
    });
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function loadDraft(draft: Draft) {
    setFormData({
      ms_id: draft.metadata['MS ID:'] || '',
      sigla: draft.filename.replace('.docx', ''),
      date: draft.metadata['Date:'] || '',
      other_names: draft.metadata['Other Names:'] || '',
      contents: draft.metadata['Contents:'] || '',
      place_of_origin: draft.metadata['Origin:'] || '',
      total_folia: draft.metadata['Total Folia:'] || '',
      dimensions: draft.metadata['Dimensions:'] || '',
      materials: draft.metadata['Materials:'] || '',
      laod_folia: draft.metadata['Laod Folia:'] || '',
      format_description: draft.metadata['Format Description:'] || '',
      transcription: draft.verses.map(v => v.verse_text).join('\n')
    });
    if (draft.image_filename) {
      setSelectedImage(`${API_BASE_URL}/media/${draft.image_filename}`);
      setSelectedImageFile(null);
    } else {
      setSelectedImage(null);
      setSelectedImageFile(null);
    }
    setCurrentModalImageError(false);
    onClose();
  }

  async function handleSaveAsDraft() {
    // Check if all fields are empty (including verses)
    const allFields = [
      formData.ms_id,
      formData.sigla,
      formData.date,
      formData.other_names,
      formData.contents,
      formData.place_of_origin,
      formData.total_folia,
      formData.dimensions,
      formData.materials,
      formData.laod_folia,
      formData.format_description,
      formData.transcription
    ];
    const allEmpty = allFields.every(field => !field || field.trim() === '');
    if (allEmpty) {
      toast({
        title: 'Cannot save empty draft',
        description: 'Please fill in at least one field or add a verse before saving as draft.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    try {
      setIsLoading(true);
      
      // Check if a draft with the same filename already exists
      const existingDraft = drafts.find(draft => draft.filename === `${formData.sigla}.docx`);
      
      if (existingDraft) {
        setExistingDraft(existingDraft);
        onConfirmModalOpen();
        return;
      }

      await saveDraft();
    } catch (error) {
      toast({
        title: 'Error saving draft',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveDraft() {
    const formDataToSend = new FormData();
    formDataToSend.append('document', JSON.stringify({
      filename: `${formData.sigla}.docx`,
      metadata: {
        'MS ID:': formData.ms_id,
        'Other Names:': formData.other_names,
        'Contents:': formData.contents,
        'Date:': formData.date,
        'Origin:': formData.place_of_origin,
        'Total Folia:': formData.total_folia,
        'Dimensions:': formData.dimensions,
        'Materials:': formData.materials,
        'Laod Folia:': formData.laod_folia,
        'Format Description:': formData.format_description
      },
      verses: formData.transcription
        .split('\n')
        .map((line, index) => ({
          verse_number: index + 1,
          verse_text: line.trim()
        }))
        .filter(verse => verse.verse_text.length > 0)
    }));

    if (selectedImageFile) {
      formDataToSend.append('image', selectedImageFile, selectedImageFile.name);
    }

    const endpoint = existingDraft ? 'draft/replace/' : 'draft/';
    const response = await fetch(`${API_BASE_URL}/api/documents/${endpoint}`, {
      method: 'POST',
      body: formDataToSend
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save draft');
    }

    toast({
      title: existingDraft ? 'Draft replaced' : 'Draft saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setExistingDraft(null);
    fetchDrafts();
  }

  async function handleComplete() {
    try {
      setIsLoading(true);
      // Validate required fields
      const requiredFields = ['ms_id', 'sigla', 'date'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
      }

      // Process transcription into verses
      // Split by newlines and filter out empty lines
      const verses = formData.transcription
        .split('\n')
        .map((line, index) => ({
          verse_number: index + 1,
          verse_text: line.trim()
        }))
        .filter(verse => verse.verse_text.length > 0);

      const formDataToSend = new FormData();
      
      // Add the main document data
      formDataToSend.append('document', JSON.stringify({
        filename: `${formData.sigla}.docx`,
        metadata: {
          'MS ID:': formData.ms_id,
          'Other Names:': formData.other_names,
          'Contents:': formData.contents,
          'Date:': formData.date,
          'Origin:': formData.place_of_origin,
          'Total Folia:': formData.total_folia,
          'Dimensions:': formData.dimensions,
          'Materials:': formData.materials,
          'Laod Folia:': formData.laod_folia,
          'Format Description:': formData.format_description
        },
        verses: verses
      }));

      // Add the image if it exists
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile, selectedImageFile.name);
      }

      const response = await fetch(`${API_BASE_URL}/api/documents/create/`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit manuscript');
      }

      // Delete the draft if it exists
      try {
        await fetch(`${API_BASE_URL}/api/documents/draft/${formData.sigla}.docx/delete/`, {
          method: 'DELETE',
        });
        fetchDrafts();
      } catch (e) {
        // Ignore errors here, just try to clean up
      }

      toast({
        title: 'Manuscript submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect to ManuscriptViewer for the new manuscript
      window.location.href = `/manuscript-viewer/${formData.sigla}`;
      // Or, if using react-router: navigate(`/manuscript-viewer/${formData.sigla}`);
      // Clear form after successful submission
      handleClear();
    } catch (error) {
      toast({
        title: 'Error submitting manuscript',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteDraft(filename: string) {
    try {
      await fetch(`${API_BASE_URL}/api/documents/draft/${filename}/delete/`, {
        method: 'DELETE',
      });
      fetchDrafts();
      toast({
        title: 'Draft deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting draft',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  function openDeleteDialog(filename: string) {
    setDraftToDelete(filename);
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setIsDeleteDialogOpen(false);
    setDraftToDelete(null);
  }

  async function confirmDeleteDraft() {
    if (draftToDelete) {
      await handleDeleteDraft(draftToDelete);
      closeDeleteDialog();
    }
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">New Data Entry</Heading>
          <Flex position="absolute" right={6} top="50%" transform="translateY(-50%)" gap={4}>
            <Button 
              bg="#B8860B"
              color="white"
              _hover={{ bg: "#9A7B0A" }}
              onClick={onOpen}
              borderRadius="full"
              size="md"
              px={8}
            >
              View Drafts
            </Button>
            <Button 
              bg="#CB0606"
              color="white"
              _hover={{ bg: "#A80505" }}
              onClick={handleClear}
              borderRadius="full"
              size="md"
              px={8}
              isDisabled={isLoading}
            >
              Clear
            </Button>
            <Button 
              bg="#B8860B"
              color="white"
              _hover={{ bg: "#9A7B0A" }}
              onClick={handleSaveAsDraft}
              borderRadius="full"
              size="md"
              px={8}
              isLoading={isLoading}
              loadingText="Saving..."
            >
              Save as draft
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleComplete}
              borderRadius="full"
              size="md"
              px={8}
              isLoading={isLoading}
              loadingText="Submitting..."
            >
              Complete
            </Button>
          </Flex>
        </Box>

        {/* Drafts Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent maxW="600px">
            <ModalHeader>Saved Drafts</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box overflowX="auto" maxH="350px">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>MS ID</Th>
                      <Th>Sigla</Th>
                      <Th>Date</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {drafts.map((draft) => (
                      <Tr key={draft._id}>
                        <Td>
                          <Tooltip label={draft.metadata['MS ID:'] || '[None]'} hasArrow>
                            <Box isTruncated maxW="120px">
                              {draft.metadata['MS ID:'] ? draft.metadata['MS ID:'] : '[None]'}
                            </Box>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={draft.filename.replace('.docx', '') || '[None]'} hasArrow>
                            <Box isTruncated maxW="80px">
                              {draft.filename.replace('.docx', '') ? draft.filename.replace('.docx', '') : '[None]'}
                            </Box>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={draft.metadata['Date:'] || '[None]'} hasArrow>
                            <Box isTruncated maxW="80px">
                              {draft.metadata['Date:'] ? draft.metadata['Date:'] : '[None]'}
                            </Box>
                          </Tooltip>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              colorScheme="blue"
                              size="sm"
                              onClick={() => loadDraft(draft)}
                            >
                              Continue Editing
                            </Button>
                            <Button
                              colorScheme="red"
                              size="sm"
                              onClick={() => openDeleteDialog(draft.filename)}
                            >
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={closeDeleteDialog}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Draft
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this draft? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={closeDeleteDialog}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDeleteDraft} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Confirm Replace Draft Modal */}
        <Modal isOpen={isConfirmModalOpen} onClose={onConfirmModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Replace Existing Draft?</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                A draft with the name "{formData.sigla}" already exists. Would you like to replace it?
              </Text>
              
              <Flex gap={8} mb={4}>
                {/* Existing Draft */}
                <Box flex={1}>
                  <Text fontWeight="bold" mb={2}>Current Draft Contents:</Text>
                  <Table variant="simple" size="sm" mb={4}>
                    <Thead>
                      <Tr>
                        <Th>Field</Th>
                        <Th>Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>MS ID</Td>
                        <Td>{existingDraft?.metadata['MS ID:']}</Td>
                      </Tr>
                      <Tr>
                        <Td>Date</Td>
                        <Td>{existingDraft?.metadata['Date:']}</Td>
                      </Tr>
                      <Tr>
                        <Td>Contents</Td>
                        <Td>{existingDraft?.metadata['Contents:']}</Td>
                      </Tr>
                      <Tr>
                        <Td>Verses</Td>
                        <Td>{existingDraft?.verses.length || 0} verses</Td>
                      </Tr>
                    </Tbody>
                  </Table>

                  {existingDraft?.image_filename && !currentModalImageError ? (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Current Image:</Text>
                      <Image
                        src={`${API_BASE_URL}/media/${existingDraft.image_filename}`}
                        alt="Current draft image"
                        maxH="200px"
                        objectFit="contain"
                        onError={() => setCurrentModalImageError(true)}
                      />
                    </Box>
                  ) : (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Current Image:</Text>
                    </Box>
                  )}
                </Box>

                {/* New Draft */}
                <Box flex={1}>
                  <Text fontWeight="bold" mb={2}>New Draft Contents:</Text>
                  <Table variant="simple" size="sm" mb={4}>
                    <Thead>
                      <Tr>
                        <Th>Field</Th>
                        <Th>Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>MS ID</Td>
                        <Td>{formData.ms_id}</Td>
                      </Tr>
                      <Tr>
                        <Td>Date</Td>
                        <Td>{formData.date}</Td>
                      </Tr>
                      <Tr>
                        <Td>Contents</Td>
                        <Td>{formData.contents}</Td>
                      </Tr>
                      <Tr>
                        <Td>Verses</Td>
                        <Td>{formData.transcription.split('\n').filter(line => line.trim().length > 0).length} verses</Td>
                      </Tr>
                    </Tbody>
                  </Table>

                  {selectedImage ? (
                    <Box>
                      <Text fontWeight="bold" mb={2}>New Image:</Text>
                      <Image
                        src={selectedImage}
                        alt="New draft image"
                        maxH="200px"
                        objectFit="contain"
                      />
                    </Box>
                  ) : (
                    <Box>
                      <Text fontWeight="bold" mb={2}>New Image:</Text>
                    </Box>
                  )}
                </Box>
              </Flex>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onConfirmModalClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={async () => {
                  onConfirmModalClose();
                  await saveDraft();
                }}
                isLoading={isLoading}
              >
                Replace Draft
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Box ml={8} p={6}>
          <Flex gap={12}>
            <Box flex={1}>
              <Flex mb={6} gap={6}>
                <Box flex={2}>
                  <Text fontSize="lg" mb={2}>MS ID</Text>
                  <Input 
                    name="ms_id"
                    value={formData.ms_id}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Sigla</Text>
                  <Input 
                    name="sigla"
                    value={formData.sigla}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Date</Text>
                  <Input 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
              </Flex>

              <Flex mb={6} gap={6}>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Other Names</Text>
                  <Input 
                    name="other_names"
                    value={formData.other_names}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Contents</Text>
                  <Input 
                    name="contents"
                    value={formData.contents}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Place of Origin</Text>
                  <Input 
                    name="place_of_origin"
                    value={formData.place_of_origin}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
              </Flex>

              <Flex mb={6} gap={6}>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Total Folia</Text>
                  <Input 
                    name="total_folia"
                    value={formData.total_folia}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Dimensions</Text>
                  <Input 
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Materials</Text>
                  <Input 
                    name="materials"
                    value={formData.materials}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Laod. Folia</Text>
                  <Input 
                    name="laod_folia"
                    value={formData.laod_folia}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
              </Flex>
            </Box>

            <Box flex={0.4} minW="300px">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <Box 
                border="2px dashed" 
                borderColor="gray.400" 
                borderRadius="md"
                height="300px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.100"
                cursor="pointer"
                _hover={{ bg: "gray.200" }}
                onClick={handleImageClick}
                position="relative"
                overflow="hidden"
              >
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt="Selected manuscript"
                    objectFit="contain"
                    maxH="100%"
                    maxW="100%"
                  />
                ) : (
                  <VStack spacing={2}>
                    <Text color="gray.500" fontSize="lg">Upload image</Text>
                    <Text color="gray.400" fontSize="sm">Click to select a file</Text>
                  </VStack>
                )}
              </Box>
            </Box>
          </Flex>

          <Box mt={1}>
            <Text fontSize="lg" mb={2}>Format Description</Text>
            <Input 
              name="format_description"
              value={formData.format_description}
              onChange={handleChange}
              size="lg"
              borderColor="gray.400"
              width="100%"
            />
          </Box>

          <Box mt={6}>
            <Text fontSize="lg" mb={2}>Transcription</Text>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Enter each verse on a new line. Press Enter/Return to start a new verse.
            </Text>
            <Textarea
              name="transcription"
              value={formData.transcription}
              onChange={handleChange}
              placeholder="Enter verses here...&#13;&#10;Press Enter/Return for each new verse"
              size="lg"
              height="500px"
              resize="vertical"
              borderColor="gray.400"
              width="100%"
              whiteSpace="pre-wrap"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default NewDataEntry; 