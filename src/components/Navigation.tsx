import React from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Stack,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArchiveIcon from '@mui/icons-material/Archive';
import CalculateIcon from '@mui/icons-material/Calculate';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  // Helper to determine if a path is active
  const isActive = (path: string) => location.pathname === path;

  // Common styles for all nav buttons
  const navButtonStyle = {
    color: '#fff',
    margin: '0 8px',
    borderRadius: '8px',
    padding: '8px 16px',
    textTransform: 'none',
    fontWeight: 500,
    minWidth: '120px',
  };

  // Active button style
  const getNavButtonStyle = (path: string) => ({
    ...navButtonStyle,
    backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
  });

  return (
    <>
      {/* Add a placeholder for the fixed AppBar height to prevent content jumping */}
      <AppBar 
        position="fixed" 
        elevation={1} 
        sx={{ 
          backgroundColor: '#2E3B55',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100%',
          left: 0,
          right: 0,
        }}
      >
        <Container maxWidth={false} sx={{ px: 3 }}>
          <Toolbar sx={{ height: '64px', p: 0 }}>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                flexGrow: 1,
              }}
            >
              Property Analyzer
            </Typography>
            
            <Stack 
              direction="row" 
              spacing={1}
            >
              <Button
                component={RouterLink}
                to="/properties"
                startIcon={<HomeIcon />}
                sx={getNavButtonStyle('/properties')}
              >
                Properties
              </Button>
              
              <Button
                component={RouterLink}
                to="/archived"
                startIcon={<ArchiveIcon />}
                sx={getNavButtonStyle('/archived')}
              >
                Archived
              </Button>
              
              <Button
                component={RouterLink}
                to="/calculator"
                startIcon={<CalculateIcon />}
                sx={getNavButtonStyle('/calculator')}
              >
                Calculator
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      {/* Toolbar placeholder to push content below appbar */}
      <Toolbar sx={{ height: '64px', mb: 2 }} />
      
      {/* Content container with scrolling capabilities */}
      <Container maxWidth={false} sx={{ 
        flexGrow: 1, 
        p: 3, 
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <Outlet />
      </Container>
    </>
  );
};

export default Navigation; 