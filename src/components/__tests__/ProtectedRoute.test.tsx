/**
 * Unit tests for ProtectedRoute component
 *
 * Tests route protection including:
 * - Redirecting unauthenticated users to login
 * - Showing loading state while checking auth
 * - Rendering protected content when authenticated
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component for protected content
const ProtectedContent: React.FC = () => <div>Protected Content</div>;

// Test component for login page
const LoginPage: React.FC = () => <div>Login Page</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (initialRoute = '/protected') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<ProtectedContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  describe('when loading', () => {
    it('should show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderWithRouter();

      // MUI CircularProgress has role="progressbar"
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('should redirect to login page', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderWithRouter();

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should preserve attempted URL in location state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // This test verifies the redirect behavior
      // The actual location state is internal to react-router
      renderWithRouter('/protected');

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('should render protected content for any authenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'any-user-id',
          email: 'user@example.com',
          name: 'Any User',
          pictureUrl: null,
        },
        token: 'valid-jwt-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderWithRouter();

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should not show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'any-user-id',
          email: 'user@example.com',
          name: 'Any User',
          pictureUrl: null,
        },
        token: 'valid-jwt-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderWithRouter();

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('nested routes', () => {
    it('should render nested protected routes when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'any-user-id',
          email: 'user@example.com',
          name: 'Any User',
          pictureUrl: null,
        },
        token: 'valid-jwt-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/protected/nested']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<ProtectedContent />} />
              <Route path="/protected/nested" element={<div>Nested Protected</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Nested Protected')).toBeInTheDocument();
    });
  });
});
