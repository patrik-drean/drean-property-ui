import { useTheme, useMediaQuery } from '@mui/material';

/**
 * Custom hook for responsive layout decisions across the application
 * Provides consistent breakpoints for when to show cards vs tables
 */
export const useResponsiveLayout = () => {
  const theme = useTheme();
  
  // Breakpoints for different layouts
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const isTablet = useMediaQuery(theme.breakpoints.down('lg')); // < 1200px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px
  
  // Layout decisions
  const useCardLayout = isTablet; // Use cards on mobile and tablet
  const useTableLayout = isDesktop; // Use tables on desktop
  
  // Grid configurations
  const getGridColumns = () => {
    if (isMobile) return 1; // Single column on mobile
    if (isTablet) return 2; // Two columns on tablet
    return 3; // Three columns on desktop (if using grid layout)
  };
  
  // Card spacing
  const getCardSpacing = () => {
    if (isMobile) return 1; // Smaller spacing on mobile
    return 2; // Standard spacing on tablet and desktop
  };
  
  // Typography scaling
  const getTypographyScale = () => {
    if (isMobile) return 0.9; // Smaller text on mobile
    return 1; // Standard text on tablet and desktop
  };

  return {
    // Breakpoints
    isMobile,
    isTablet,
    isDesktop,
    
    // Layout decisions
    useCardLayout,
    useTableLayout,
    
    // Configuration helpers
    getGridColumns,
    getCardSpacing,
    getTypographyScale,
    
    // Common responsive props
    responsiveProps: {
      display: {
        xs: useCardLayout ? 'flex' : 'none',
        lg: useTableLayout ? 'block' : 'none',
      },
      flexDirection: 'column',
      gap: getCardSpacing(),
    },
  };
};

export default useResponsiveLayout;
