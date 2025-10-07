import React from 'react';
import { Container, Box } from '@mui/material';
import { PortfolioPLReport } from '../components/Reports/PortfolioPLReport';

export const PortfolioPLReportPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <PortfolioPLReport />
      </Box>
    </Container>
  );
};
