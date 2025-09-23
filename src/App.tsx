import React from 'react';
import { createHashRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { PropertiesProvider } from './contexts/PropertiesContext';
import Navigation from './components/Navigation';
import PropertiesPage from './components/PropertiesPage';
import ArchivedPropertiesPage from './components/ArchivedPropertiesPage';
import Calculator from './components/Calculator';
import PropertyLeadsPage from './components/PropertyLeadsPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import TeamPage from './components/TeamPage';
import { ReportsPage } from './pages/ReportsPage';

const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<Navigation />}>
      <Route path="/" element={<Navigate to="/properties" replace />} />
      <Route path="/properties" element={<PropertiesPage />} />
      <Route path="/properties/:id" element={<PropertyDetailsPage />} />
      <Route path="/archived" element={<ArchivedPropertiesPage />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/leads" element={<PropertyLeadsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/team" element={<TeamPage />} />
    </Route>
  )
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PropertiesProvider>
        <RouterProvider router={router} />
      </PropertiesProvider>
    </ThemeProvider>
  );
};

export default App;
