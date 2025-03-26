import React from 'react';
import { Container, Typography } from '@mui/material';

const ArchivedPropertiesPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Archived Properties
      </Typography>
      <Typography>
        Coming soon...
      </Typography>
    </Container>
  );
};

export default ArchivedPropertiesPage; 