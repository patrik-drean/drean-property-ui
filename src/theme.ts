import { createTheme } from '@mui/material/styles';

// Extend the theme to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    neutral?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1B4D3E',      // Forest green - trust, growth, stability
      light: '#2E7D32',      // Lighter green for hover states
      dark: '#0D2818',       // Darker green for active states
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D4AF37',       // Gold - wealth, success, premium
      light: '#FFD700',      // Lighter gold for highlights
      dark: '#B8860B',       // Darker gold for pressed states
      contrastText: '#000000',
    },
    accent: {
      main: '#14b8a6',       // Teal - modern sophistication
      light: '#5eead4',      // Lighter teal for accents
      dark: '#0f766e',       // Darker teal for active states
      contrastText: '#ffffff',
    },
    neutral: {
      main: '#737373',       // Gray - neutral elements
      light: '#a3a3a3',      // Lighter gray
      dark: '#404040',       // Darker gray
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e',       // Green for positive metrics
      light: '#4ade80',
      dark: '#16a34a',
    },
    warning: {
      main: '#f59e0b',       // Amber for caution metrics
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',       // Red for negative metrics
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: '#fafafa',    // Very light gray background
      paper: '#ffffff',      // White for cards and surfaces
    },
    text: {
      primary: '#171717',     // Almost black for primary text
      secondary: '#525252',   // Dark gray for secondary text
    },
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '16px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#d4d4d4',
            borderRadius: '20px',
            border: '6px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#a3a3a3',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '24px',
          paddingRight: '24px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1B4D3E',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px',
          '@media (min-width:0px)': {
            minHeight: '64px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          padding: '8px 24px',
          minHeight: '44px',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e5e5',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#1B4D3E',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#fafafa',
          },
          '&:hover': {
            backgroundColor: '#f0f9f4',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e5e5e5',
          padding: '12px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1B4D3E',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1B4D3E',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'rgba(27, 77, 62, 0.08)',
          },
        },
      },
    },
  },
});

export default theme; 