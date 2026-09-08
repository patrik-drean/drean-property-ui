import React from 'react';
import { Container } from '@mui/material';
import { PortfolioPLReport } from '../components/Reports/PortfolioPLReport';

export const PortfolioPLReportPage: React.FC = () => {
  // Page owns its scroller: the global stylesheet sets overflow-y hidden on body
  return (
    <Container maxWidth="xl" sx={{ py: 3, px: 2, height: '100vh', overflowY: 'auto' }}>
      <PortfolioPLReport months={6} />
    </Container>
  );
};
