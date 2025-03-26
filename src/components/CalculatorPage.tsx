import React from 'react';
import { Container, Typography } from '@mui/material';

const CalculatorPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Calculator
      </Typography>
      <Typography variant="body1">
        Calculator functionality coming soon...
      </Typography>
    </Container>
  );
};

export default CalculatorPage; 