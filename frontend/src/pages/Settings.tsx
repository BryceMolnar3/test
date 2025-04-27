import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Select,
  Button,
  FormControl,
  FormLabel,
  useToast,
  HStack,
  Icon,
  Flex,
  Text,
  Input,
  IconButton,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, RepeatIcon, EditIcon, AddIcon, DeleteIcon } from '@chakra-ui/icons';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// Default variation types
const defaultVariationTypes = [
  "Different Spelling",
  "Abbreviation",
  "Word Choice",
  "Word Order",
  "Addition",
  "Omission"
];

// TODO: Move to a separate API service file
const variationTypesService = {
  async fetchTypes() {
    // TODO: Replace with actual API call
    const savedTypes = localStorage.getItem('variationTypes');
    if (savedTypes) {
      return JSON.parse(savedTypes);
    }
    return defaultVariationTypes;
  },

  async saveTypes(types: string[]) {
    // TODO: Replace with actual API call
    localStorage.setItem('variationTypes', JSON.stringify(types));
    return types;
  },

  async addType(type: string) {
    // TODO: Replace with actual API call
    const savedTypes = await this.fetchTypes();
    const newTypes = [...savedTypes, type];
    await this.saveTypes(newTypes);
    return newTypes;
  },

  async updateType(index: number, newValue: string) {
    // TODO: Replace with actual API call
    const savedTypes = await this.fetchTypes();
    const newTypes = [...savedTypes];
    newTypes[index] = newValue;
    await this.saveTypes(newTypes);
    return newTypes;
  },

  async deleteType(index: number) {
    // TODO: Replace with actual API call
    const savedTypes = await this.fetchTypes();
    const newTypes = savedTypes.filter(function(_, i) { return i !== index; });
    await this.saveTypes(newTypes);
    return newTypes;
  }
};

function Settings() {
  const { settings, updateSettings } = useDisplaySettings();
  const toast = useToast();
  const [variationTypes, setVariationTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add color mode values
  const alertBg = useColorModeValue('blue.50', 'rgba(37, 47, 110, 0.3)');
  const alertBorder = useColorModeValue('blue.100', 'rgba(44, 82, 130, 0.5)');

  useEffect(function() {
    async function loadTypes() {
      try {
        setIsLoading(true);
        setError(null);
        const types = await variationTypesService.fetchTypes();
        setVariationTypes(types);
      } catch (err) {
        setError('Failed to load variation types');
        console.error('Error loading variation types:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTypes();
  }, []);

  function handleChange(field: string, value: string | boolean) {
    updateSettings({ [field]: value });
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);
      
      // Save display settings
      localStorage.setItem('displaySettings', JSON.stringify(settings));
      
      // Save variation types
      await variationTypesService.saveTypes(variationTypes);
      
      toast({
        title: 'Settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError('Failed to save settings');
      toast({
        title: 'Error saving settings',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddType() {
    if (newType.trim() && !variationTypes.includes(newType.trim())) {
      try {
        setError(null);
        const updatedTypes = await variationTypesService.addType(newType.trim());
        setVariationTypes(updatedTypes);
        setNewType('');
        toast({
          title: 'Variation type added',
          description: 'Remember to save your changes',
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        setError('Failed to add variation type');
        toast({
          title: 'Error adding variation type',
          description: 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }

  function handleEditType(index: number) {
    setEditingIndex(index);
    setEditValue(variationTypes[index]);
  }

  async function handleSaveEdit(index: number) {
    if (editValue.trim() && !variationTypes.includes(editValue.trim())) {
      try {
        setError(null);
        const updatedTypes = await variationTypesService.updateType(index, editValue.trim());
        setVariationTypes(updatedTypes);
        toast({
          title: 'Variation type updated',
          description: 'Remember to save your changes',
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        setError('Failed to update variation type');
        toast({
          title: 'Error updating variation type',
          description: 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setEditingIndex(null);
        setEditValue('');
      }
    }
  }

  async function handleDeleteType(index: number) {
    if (variationTypes.length <= 1) {
      toast({
        title: 'Cannot delete',
        description: 'At least one variation type must remain',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setError(null);
      const updatedTypes = await variationTypesService.deleteType(index);
      setVariationTypes(updatedTypes);
      toast({
        title: 'Variation type deleted',
        description: 'Remember to save your changes',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      setError('Failed to delete variation type');
      toast({
        title: 'Error deleting variation type',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewType(e.target.value);
  }

  function handleEditInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditValue(e.target.value);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleAddType();
    }
  }

  function handleEditKeyPress(e: React.KeyboardEvent, index: number) {
    if (e.key === 'Enter') {
      handleSaveEdit(index);
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>, field: string) {
    handleChange(field, e.target.value);
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Settings</Heading>
          <Flex position="absolute" right={6} top="50%" transform="translateY(-50%)" gap={4}>
            <Button
              colorScheme="green"
              onClick={handleSave}
              borderRadius="full"
              size="md"
              px={8}
              leftIcon={<Icon as={RepeatIcon} />}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </Flex>
        </Box>

        <Box p={8} maxW="1200px" mx="auto">
          <Alert 
            status="info" 
            mb={6} 
            borderRadius="md"
            colorScheme="blue"
            variant="left-accent"
          >
            <AlertIcon />
            <Text>
              <strong>Important:</strong> Remember to click "Save Changes" before refreshing or navigating away. Unsaved changes will be lost.
            </Text>
          </Alert>

          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}

          <VStack spacing={8} align="stretch">
            {/* Display Settings */}
            <Box>
              <HStack mb={4}>
                <Icon as={ViewIcon} fontSize="24px" color="gray.600" />
                <Heading size="md">Display Settings</Heading>
              </HStack>
              <VStack spacing={4} align="stretch" pl={8}>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb={0}>Theme</FormLabel>
                  <Select
                    value={settings.theme}
                    onChange={function(e) { handleSelectChange(e, 'theme'); }}
                    width="200px"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb={0}>Font Size</FormLabel>
                  <Select
                    value={settings.fontSize}
                    onChange={function(e) { handleSelectChange(e, 'fontSize'); }}
                    width="200px"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>

            {/* Variation Types */}
            <Box>
              <HStack mb={4}>
                <Icon as={EditIcon} fontSize="24px" color="gray.600" />
                <Heading size="md">Variation Types</Heading>
                {isLoading && <Spinner size="sm" />}
              </HStack>
              <VStack spacing={4} align="stretch" pl={8}>
                {!isLoading && variationTypes.map(function(type, index) {
                  return (
                    <Flex key={index} align="center" justify="space-between">
                      {editingIndex === index ? (
                        <Input
                          value={editValue}
                          onChange={handleEditInputChange}
                          onBlur={function() { handleSaveEdit(index); }}
                          onKeyPress={function(e) { handleEditKeyPress(e, index); }}
                          width="300px"
                        />
                      ) : (
                        <Text>{type}</Text>
                      )}
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit variation type"
                          icon={<EditIcon />}
                          size="sm"
                          onClick={function() { handleEditType(index); }}
                        />
                        <IconButton
                          aria-label="Delete variation type"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={function() { handleDeleteType(index); }}
                        />
                      </HStack>
                    </Flex>
                  );
                })}
                {!isLoading && (
                  <Flex mt={4} gap={4}>
                    <Input
                      placeholder="Add new variation type"
                      value={newType}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                    />
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={handleAddType}
                      colorScheme="blue"
                      isDisabled={!newType.trim()}
                    >
                      Add Type
                    </Button>
                  </Flex>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default Settings; 