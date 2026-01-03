import React from 'react';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const AccessDenied: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderRadius: 3,
          }}
        >
          <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don't have permission to access PropGuide.
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Signed in as: {user.email}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={logout}
            sx={{ mt: 2 }}
          >
            Sign Out
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default AccessDenied;
