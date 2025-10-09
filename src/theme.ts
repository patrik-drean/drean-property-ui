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
      main: '#1E293B',       // Slate 800 - Modern, professional
      light: '#475569',      // Slate 600 - For subheaders and hover states
      dark: '#0F172A',       // Slate 900 - For active states
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06B6D4',       // Cyan 500 - Innovation, clarity
      light: '#22D3EE',      // Cyan 400 - For highlights
      dark: '#0891B2',       // Cyan 600 - For pressed states
      contrastText: '#ffffff',
    },
    accent: {
      main: '#10B981',       // Emerald 500 - Success, positive returns
      light: '#34D399',      // Emerald 400 - For accents
      dark: '#059669',       // Emerald 600 - For active states
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
          backgroundColor: '#1E293B',
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
            backgroundColor: '#1E293B',
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
            backgroundColor: '#f1f5f9',  // Slate 100 - subtle hover
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
              borderColor: '#1E293B',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#06B6D4',  // Cyan accent on focus
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
            backgroundColor: 'rgba(30, 41, 59, 0.08)',  // Slate 800 with transparency
          },
        },
      },
    },
  },
});

export default theme; 