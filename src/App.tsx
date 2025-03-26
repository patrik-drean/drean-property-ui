import React from 'react';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Navigation from './components/Navigation';
import PropertiesPage from './components/PropertiesPage';
import ArchivedPropertiesPage from './components/ArchivedPropertiesPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Navigation />}>
      <Route path="/" element={<Navigate to="/properties" replace />} />
      <Route path="/properties" element={<PropertiesPage />} />
      <Route path="/archived" element={<ArchivedPropertiesPage />} />
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
