import React from 'react';
import { Flex, Text, Image, IconButton, Button } from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

function NavigationBar() {
  const navigate = useNavigate();

  function handleSearchClick() {
    navigate('/search-database');
  }

  function handleNewEntryClick() {
    navigate('/new-data-entry');
  }

  function handleDifferentiationClick() {
    navigate('/manual-differentiation');
  }

  function handlePhylogeneticClick() {
    navigate('/phylogenetic-analysis');
  }

  function handleSettingsClick() {
    navigate('/settings');
  }

  return (
    <Flex 
      bg="beige" 
      p={4} 
      justifyContent="space-between" 
      alignItems="center"
    >
      <Flex flex={1} gap={4} alignItems="center">
        <Image 
          src="/images/Hamilton_Logo.png"
          alt="Hamilton College Logo"
          height="80px"
          marginRight={4}
        />
        <Flex flex={1} justifyContent="center">
          <Button
            variant="ghost"
            color="gray.600"
            fontSize={20}
            fontWeight={200}
            whiteSpace="pre-wrap"
            onClick={handleSearchClick}
          >
            Search{'\n'}database
          </Button>
          <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
          <Button
            variant="ghost"
            color="gray.600"
            fontSize={20}
            fontWeight={200}
            whiteSpace="pre-wrap"
            onClick={handleNewEntryClick}
          >
            New{'\n'}data entry
          </Button>
          <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
          <Button
            variant="ghost"
            color="gray.600"
            fontSize={20}
            fontWeight={200}
            whiteSpace="pre-wrap"
            onClick={handleDifferentiationClick}
          >
            Manual{'\n'}differentiation
          </Button>
          <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
          <Button
            variant="ghost"
            color="gray.600"
            fontSize={20}
            fontWeight={200}
            whiteSpace="pre-wrap"
            onClick={handlePhylogeneticClick}
          >
            Phylogenetic{'\n'}analysis
          </Button>
        </Flex>
      </Flex>
      <IconButton
        aria-label="Settings"
        icon={<SettingsIcon fontSize="32px" />}
        variant="ghost"
        onClick={handleSettingsClick}
        size="lg"
        p={6}
        color="gray.600"
      />
    </Flex>
  );
}

export default NavigationBar; 