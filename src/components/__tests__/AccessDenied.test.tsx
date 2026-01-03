/**
 * Unit tests for AccessDenied component
 *
 * Tests the access denied page behavior including:
 * - Rendering access denied message
 * - Showing user email when available
 * - Logout button functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessDenied } from '../AccessDenied';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockLogout = jest.fn();

describe('AccessDenied', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is available', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'non-admin-user-id',
          email: 'unauthorized@example.com',
          name: 'Unauthorized User',
          pictureUrl: null,
        },
        token: 'valid-jwt-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: mockLogout,
      });
    });

    it('should render access denied message', () => {
      render(<AccessDenied />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText("You don't have permission to access PropGuide.")
      ).toBeInTheDocument();
    });

    it('should display the block icon', () => {
      render(<AccessDenied />);

      expect(screen.getByTestId('BlockIcon')).toBeInTheDocument();
    });

    it('should show user email when available', () => {
      render(<AccessDenied />);

      expect(
        screen.getByText('Signed in as: unauthorized@example.com')
      ).toBeInTheDocument();
    });

    it('should render Sign Out button', () => {
      render(<AccessDenied />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('should call logout when Sign Out button is clicked', () => {
      render(<AccessDenied />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user is null', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: mockLogout,
      });
    });

    it('should render access denied message without email', () => {
      render(<AccessDenied />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText("You don't have permission to access PropGuide.")
      ).toBeInTheDocument();
      expect(screen.queryByText(/Signed in as:/)).not.toBeInTheDocument();
    });

    it('should still render Sign Out button when user is null', () => {
      render(<AccessDenied />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          pictureUrl: null,
        },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: mockLogout,
      });
    });

    it('should render within a container', () => {
      render(<AccessDenied />);

      // MUI Container has a specific class
      const container = document.querySelector('.MuiContainer-root');
      expect(container).toBeInTheDocument();
    });

    it('should render within a Paper component', () => {
      render(<AccessDenied />);

      const paper = document.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });
});
