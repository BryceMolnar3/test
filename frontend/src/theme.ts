import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({ 
  config,
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Alert: {
      variants: {
        'left-accent': (props: { colorMode: string }) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'rgba(37, 47, 110, 0.3)' : 'blue.50',
            borderColor: props.colorMode === 'dark' ? 'rgba(44, 82, 130, 0.5)' : 'blue.100',
          }
        })
      }
    }
  }
});

export { theme }; 