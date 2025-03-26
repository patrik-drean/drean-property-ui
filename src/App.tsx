import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navigation from './components/Navigation';
import PropertiesPage from './components/PropertiesPage';
import CalculatorPage from './components/CalculatorPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/properties" replace />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
