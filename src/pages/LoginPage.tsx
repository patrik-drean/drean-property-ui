import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Container,
  useTheme,
} from '@mui/material';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);

    if (!credentialResponse.credential) {
      setError('No credential received from Google');
      return;
    }

    try {
      await login(credentialResponse.credential);
      navigate('/properties');
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
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
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Logo width={80} height={53} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              PropGuide AI
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary' }}
            >
              Property Investment Analysis Platform
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Google Sign-In Button */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  size="large"
                  shape="rectangular"
                  text="signin_with"
                  width="300"
                />
              </Box>

              {/* Subtitle */}
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mt: 2 }}
              >
                Sign in with your Google account to access PropGuide
              </Typography>
            </>
          )}
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 3,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          Secure authentication powered by Google
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage;
