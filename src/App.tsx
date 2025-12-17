import React from 'react';
import { createHashRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { PropertiesProvider } from './contexts/PropertiesContext';
import { MessagingPopoverProvider } from './contexts/MessagingPopoverContext';
import { MessagingPopover } from './components/messaging/MessagingPopover';
import Navigation from './components/Navigation';
import PropertiesPage from './components/PropertiesPage';
import ArchivedPropertiesPage from './components/ArchivedPropertiesPage';
import Calculator from './components/Calculator';
import PropertyLeadsPage from './components/PropertyLeadsPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import InvestmentReportPage from './pages/InvestmentReportPage';
import TeamPage from './components/TeamPage';
import { ReportsPage } from './pages/ReportsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { PropertyPLReportPage } from './pages/PropertyPLReportPage';
import { MessagingPage } from './pages/MessagingPage';
import { TemplatesPage } from './pages/TemplatesPage';

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/reports/investment/:reportId" element={<InvestmentReportPage />} />
      <Route path="/reports/property-pl/:propertyId" element={<PropertyPLReportPage />} />
      <Route element={<Navigation />}>
        <Route path="/" element={<Navigate to="/properties" replace />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/archived" element={<ArchivedPropertiesPage />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/leads" element={<PropertyLeadsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/messaging/templates" element={<TemplatesPage />} />
      </Route>
    </>
  )
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PropertiesProvider>
        <MessagingPopoverProvider>
          <RouterProvider router={router} />
          {/* Global messaging popover - persists across navigation */}
          <MessagingPopover />
        </MessagingPopoverProvider>
      </PropertiesProvider>
    </ThemeProvider>
  );
};

export default App;
