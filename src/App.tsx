import React from 'react';
import { createHashRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Navigation from './components/Navigation';
import PropertiesPage from './components/PropertiesPage';
import ArchivedPropertiesPage from './components/ArchivedPropertiesPage';
import Calculator from './components/Calculator';
import PropertyLeadsPage from './components/PropertyLeadsPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';

const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<Navigation />}>
      <Route path="/" element={<Navigate to="/properties" replace />} />
      <Route path="/properties" element={<PropertiesPage />} />
      <Route path="/properties/:address" element={<PropertyDetailsPage />} />
      <Route path="/archived" element={<ArchivedPropertiesPage />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/leads" element={<PropertyLeadsPage />} />
    </Route>
  )
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

export default App;
