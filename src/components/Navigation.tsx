import React from 'react';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';

const Navigation: React.FC = () => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Property Manager
          </Typography>
          <Box>
            <Button
              color="inherit"
              component={RouterLink}
              to="/properties"
            >
              Properties
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/archived"
            >
              Archived
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/calculator"
            >
              Calculator
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </>
  );
};

export default Navigation; 