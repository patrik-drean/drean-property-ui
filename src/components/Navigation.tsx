import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Property Analyzer
        </Typography>
        <Button color="inherit" component={RouterLink} to="/properties">
          Properties
        </Button>
        <Button color="inherit" component={RouterLink} to="/calculator">
          Calculator
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 