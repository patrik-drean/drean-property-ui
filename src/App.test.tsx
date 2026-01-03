import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock react-markdown to avoid ESM issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

// Mock API services to prevent network calls
jest.mock('./services/api', () => ({
  getProperties: jest.fn().mockResolvedValue([]),
  getPropertyLeads: jest.fn().mockResolvedValue([]),
}));

jest.mock('./services/smsService', () => ({
  smsService: {
    getConversations: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('./services/todoistApi', () => ({
  todoistApiService: {
    isConfigured: () => false,
    getSections: jest.fn().mockResolvedValue([]),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the Google OAuth provider
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGoogleLogin: () => jest.fn(),
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<App />);
    // App should render - we just verify it doesn't throw
    expect(document.body).toBeDefined();
  });

  test('checks authentication state on load', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<App />);

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });
  });
});
