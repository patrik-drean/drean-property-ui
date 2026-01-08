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
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuIcon from '@mui/icons-material/Menu';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SmsIcon from '@mui/icons-material/Sms';
import LogoutIcon from '@mui/icons-material/Logout';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const moreMenuOpen = Boolean(moreMenuAnchor);
  const userMenuOpen = Boolean(userMenuAnchor);
  const { user, logout } = useAuth();

  const handleMoreMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };
  
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

  // Remove the Todos tab from the mobile menu
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
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}>
            <Logo width={40} height={27} />
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }}>PropGuide AI</Typography>
        </Box>
        <Divider />
        <List>
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
            to="/properties"
            selected={isActive('/properties')}
          >
            <ListItemIcon>
              <HomeIcon color={isActive('/properties') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Portfolio" />
          </ListItem>
          <ListItem
            button
            component={RouterLink}
            to="/reports"
            selected={isActive('/reports')}
          >
            <ListItemIcon>
              <AssessmentIcon color={isActive('/reports') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>
          <ListItem
            button
            component={RouterLink}
            to="/transactions"
            selected={isActive('/transactions')}
          >
            <ListItemIcon>
              <AccountBalanceIcon color={isActive('/transactions') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Transactions" />
          </ListItem>
          <ListItem
            button
            component={RouterLink}
            to="/team"
            selected={isActive('/team')}
          >
            <ListItemIcon>
              <PeopleIcon color={isActive('/team') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Team" />
          </ListItem>
          <ListItem
            button
            component={RouterLink}
            to="/messaging"
            selected={isActive('/messaging')}
          >
            <ListItemIcon>
              <SmsIcon color={isActive('/messaging') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Messaging" />
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
        </List>
        {user && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={user.pictureUrl || undefined}
                  alt={user.name}
                  sx={{ width: 32, height: 32, mr: 1 }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <List>
              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </List>
          </>
        )}
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
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100%',
          left: 0,
          right: 0,
          borderRadius: 0,
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
                sx={{ mr: 2, ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box sx={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}>
                <Logo width={48} height={32} />
              </Box>
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  color: '#FFFFFF',
                  fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  lineHeight: 1
                }}
              >
                PropGuide AI
              </Typography>
            </Box>
            
            {/* Remove the Todos tab from the desktop nav */}
            {!isMobile && (
              <Stack
                direction="row"
                spacing={1}
              >
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
                  to="/properties"
                  startIcon={<HomeIcon />}
                  sx={getNavButtonStyle('/properties')}
                >
                  Portfolio
                </Button>

                <Button
                  component={RouterLink}
                  to="/messaging"
                  startIcon={<SmsIcon />}
                  sx={getNavButtonStyle('/messaging')}
                >
                  Messaging
                </Button>

                <Button
                  onClick={handleMoreMenuClick}
                  endIcon={<ExpandMoreIcon />}
                  sx={{
                    ...navButtonStyle,
                    backgroundColor: moreMenuOpen || isActive('/reports') || isActive('/transactions') || isActive('/team') || isActive('/calculator')
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    },
                  }}
                >
                  More
                </Button>
                <Menu
                  anchorEl={moreMenuAnchor}
                  open={moreMenuOpen}
                  onClose={handleMoreMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem
                    component={RouterLink}
                    to="/reports"
                    onClick={handleMoreMenuClose}
                    selected={isActive('/reports')}
                  >
                    <ListItemIcon>
                      <AssessmentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reports</ListItemText>
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/transactions"
                    onClick={handleMoreMenuClose}
                    selected={isActive('/transactions')}
                  >
                    <ListItemIcon>
                      <AccountBalanceIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Transactions</ListItemText>
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/team"
                    onClick={handleMoreMenuClose}
                    selected={isActive('/team')}
                  >
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Team</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    component={RouterLink}
                    to="/calculator"
                    onClick={handleMoreMenuClose}
                    selected={isActive('/calculator')}
                  >
                    <ListItemIcon>
                      <CalculateIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Calculator</ListItemText>
                  </MenuItem>
                </Menu>
              </Stack>
            )}

            {/* User Menu */}
            {user && (
              <Box sx={{ ml: 2 }}>
                <Tooltip title={user.name}>
                  <IconButton
                    onClick={handleUserMenuClick}
                    sx={{ p: 0.5 }}
                  >
                    <Avatar
                      src={user.pictureUrl || undefined}
                      alt={user.name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={userMenuOpen}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
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