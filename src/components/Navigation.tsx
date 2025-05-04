import React, { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArchiveIcon from '@mui/icons-material/Archive';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuIcon from '@mui/icons-material/Menu';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Navigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  
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

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const mobileMenu = (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={toggleDrawer}
    >
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={toggleDrawer}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold">Property Analyzer</Typography>
        </Box>
        <Divider />
        <List>
          <ListItem 
            button 
            component={RouterLink} 
            to="/properties"
            selected={isActive('/properties')}
          >
            <ListItemIcon>
              <HomeIcon color={isActive('/properties') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Properties" />
          </ListItem>
          <ListItem 
            button 
            component={RouterLink} 
            to="/leads"
            selected={isActive('/leads')}
          >
            <ListItemIcon>
              <ListAltIcon color={isActive('/leads') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Leads" />
          </ListItem>
          <ListItem 
            button 
            component={RouterLink} 
            to="/calculator"
            selected={isActive('/calculator')}
          >
            <ListItemIcon>
              <CalculateIcon color={isActive('/calculator') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Calculator" />
          </ListItem>
          <ListItem 
            button 
            component={RouterLink} 
            to="/todos"
            selected={isActive('/todos')}
          >
            <ListItemIcon>
              <CheckCircleIcon color={isActive('/todos') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Todos" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );

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
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 3 } }}>
          <Toolbar sx={{ height: '64px', p: 0 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                flexGrow: 1,
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              Property Analyzer
            </Typography>
            
            {!isMobile && (
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
                  to="/leads"
                  startIcon={<ListAltIcon />}
                  sx={getNavButtonStyle('/leads')}
                >
                  Leads
                </Button>
                
                <Button
                  component={RouterLink}
                  to="/calculator"
                  startIcon={<CalculateIcon />}
                  sx={getNavButtonStyle('/calculator')}
                >
                  Calculator
                </Button>

                <Button
                  component={RouterLink}
                  to="/todos"
                  startIcon={<CheckCircleIcon />}
                  sx={getNavButtonStyle('/todos')}
                >
                  Todos
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      {/* Mobile drawer menu */}
      {isMobile && mobileMenu}
      
      {/* Toolbar placeholder to push content below appbar */}
      <Toolbar sx={{ height: '64px', mb: 2 }} />
      
      {/* Content container with scrolling capabilities */}
      <Container maxWidth={false} sx={{ 
        flexGrow: 1, 
        p: { xs: 1, sm: 2, md: 3 }, 
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