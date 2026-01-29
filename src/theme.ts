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
    mode: 'dark',
    primary: {
      main: '#4ade80',       // Green accent for primary actions
      light: '#86efac',      // Lighter green for hover states
      dark: '#22c55e',       // Darker green for active states
      contrastText: '#0d1117',
    },
    secondary: {
      main: '#60a5fa',       // Blue accent
      light: '#93c5fd',      // Lighter blue
      dark: '#3b82f6',       // Darker blue
      contrastText: '#0d1117',
    },
    accent: {
      main: '#4ade80',       // Green accent
      light: '#86efac',      // Lighter green
      dark: '#22c55e',       // Darker green
      contrastText: '#0d1117',
    },
    neutral: {
      main: '#8b949e',       // Gray for neutral elements
      light: '#c9d1d9',      // Lighter gray
      dark: '#6e7681',       // Darker gray
      contrastText: '#0d1117',
    },
    success: {
      main: '#4ade80',       // Green for positive metrics
      light: '#86efac',
      dark: '#22c55e',
    },
    warning: {
      main: '#fbbf24',       // Yellow for caution metrics
      light: '#fcd34d',
      dark: '#f59e0b',
    },
    error: {
      main: '#f87171',       // Red for negative metrics
      light: '#fca5a5',
      dark: '#ef4444',
    },
    background: {
      default: '#0d1117',    // Main app background (dark)
      paper: '#161b22',      // Cards and surfaces
    },
    text: {
      primary: '#f0f6fc',    // Primary text (light)
      secondary: '#8b949e',  // Secondary text (muted)
    },
    divider: '#30363d',      // Border color
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
          backgroundColor: '#0d1117',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '16px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0d1117',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#30363d',
            borderRadius: '20px',
            border: '6px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#484f58',
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
          backgroundColor: '#161b22',
          borderBottom: '1px solid #30363d',
          boxShadow: 'none',
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
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          },
        },
        outlined: {
          borderColor: '#30363d',
          '&:hover': {
            borderColor: '#8b949e',
            backgroundColor: 'rgba(139, 148, 158, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22',
          borderRadius: '12px',
          boxShadow: 'none',
          border: '1px solid #30363d',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22',
          backgroundImage: 'none',
          borderRadius: '12px',
          border: '1px solid #30363d',
        },
        elevation1: {
          boxShadow: 'none',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#161b22',
            color: '#8b949e',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #30363d',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#161b22',
          },
          '&:nth-of-type(even)': {
            backgroundColor: '#0d1117',
          },
          '&:hover': {
            backgroundColor: '#21262d !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #30363d',
          padding: '12px 16px',
          color: '#f0f6fc',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
        outlined: {
          borderColor: '#30363d',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#161b22',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#30363d',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#8b949e',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4ade80',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#8b949e',
          },
          '& .MuiInputBase-input': {
            color: '#f0f6fc',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161b22',
          borderRadius: '16px',
          border: '1px solid #30363d',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          color: '#f0f6fc',
          '&:hover': {
            backgroundColor: 'rgba(139, 148, 158, 0.15)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161b22',
          borderRight: '1px solid #30363d',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#21262d',
          },
          '&.Mui-selected': {
            backgroundColor: '#21262d',
            '&:hover': {
              backgroundColor: '#30363d',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#30363d',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#4ade80',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#8b949e',
          '&.Mui-selected': {
            color: '#f0f6fc',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
        standardInfo: {
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          color: '#60a5fa',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        },
        standardWarning: {
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          color: '#fbbf24',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        },
        standardError: {
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          color: '#f87171',
          border: '1px solid rgba(248, 113, 113, 0.3)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          color: '#4ade80',
          border: '1px solid rgba(74, 222, 128, 0.3)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#21262d',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          color: '#8b949e',
          borderColor: '#30363d',
          '&.Mui-selected': {
            backgroundColor: '#21262d',
            color: '#f0f6fc',
            '&:hover': {
              backgroundColor: '#30363d',
            },
          },
          '&:hover': {
            backgroundColor: '#21262d',
          },
        },
      },
    },
  },
});

export default theme; 