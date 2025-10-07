import React from 'react';
import { Container, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { PropertyPLReport } from '../components/Reports/PropertyPLReport';

export const PropertyPLReportPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();

  if (!propertyId) {
    return <div>Property ID required</div>;
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <PropertyPLReport propertyId={propertyId} />
      </Box>
    </Container>
  );
};
