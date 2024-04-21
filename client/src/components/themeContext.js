import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Define the detailed theme options for both light and dark themes
const lightThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main:  "#3f5eb5", // Corrected to your specific navbar color
    },
    secondary: {
      main: "#ffffff",
    },
    success: {
      main: "#02C39A",
    },
    info: {
      main: "#028090",
    },
    background: {
      default: "#ffffff",
      paper: "#f5f5f5",
      landing: "#f3f3ff",
    },
  },
  typography: {
    fontFamily: "Raleway",
    h1: {
      fontWeight: 400,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiButton: { defaultProps: { size: "small" } },
    MuiCheckbox: { defaultProps: { size: "small" } },
    // Additional component defaults...
  },
};

const darkThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: "#f7f097",
    },
    secondary: {
      main: "#000000",
    },
    text: {
      primary: "#f5f5f5",
      secondary: "rgba(222,222,222,0.7)",
    },
    background: {
      default: "#000000",
      paper: "#0c0c00",
      landing: "#121212",
    },
  },
  typography: {
    fontFamily: "Raleway",
    h1: {
      fontWeight: 400,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiButton: { defaultProps: { size: "small" } },
    MuiCheckbox: { defaultProps: { size: "small" } },
    // Add other components' defaults here...
  },
};

// Context setup
const ThemeContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export const ThemeProviderWrapper = ({ children }) => {
  const [themeMode, setMode] = useState('light'); 

  const toggleTheme = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => createTheme(themeMode === 'light' ? lightThemeOptions : darkThemeOptions), [themeMode]);

  return (
    <ThemeContext.Provider value={{themeMode, toggleTheme }}> 
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
