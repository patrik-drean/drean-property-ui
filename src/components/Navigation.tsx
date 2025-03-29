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
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#2E3B55' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: '#FFFFFF'
              }}
            >
              Property Analyzer
            </Typography>
            
            <Stack direction="row" spacing={1}>
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
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </>
  );
};

export default Navigation; 