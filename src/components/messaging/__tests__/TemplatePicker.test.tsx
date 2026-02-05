import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TemplatePicker } from '../TemplatePicker';
import { smsService } from '../../../services/smsService';
import { SmsTemplate, TemplateVariables } from '../../../types/sms';

// Mock the SMS service
jest.mock('../../../services/smsService');

const mockSmsService = smsService as jest.Mocked<typeof smsService>;

// Test fixtures
const mockTemplates: SmsTemplate[] = [
  {
    id: 'template-1',
    name: 'Initial Outreach',
    body: 'Hi {{name}}, I noticed your property at {{address}}. Are you interested in selling?',
    placeholders: ['name', 'address'],
    order: 1,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Follow Up',
    body: 'Hi {{name}}, just following up on my previous message about {{address}}.',
    placeholders: ['name', 'address'],
    order: 2,
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z',
  },
];

const defaultVariables: TemplateVariables = {
  name: 'John Smith',
  address: '123 Main St',
  price: '$500,000',
  phone: '+15551234567',
};

describe('TemplatePicker', () => {
  const defaultProps = {
    variables: defaultVariables,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSmsService.getTemplates.mockResolvedValue(mockTemplates);
  });

  describe('rendering', () => {
    it('should render templates button', () => {
      render(<TemplatePicker {...defaultProps} />);

      expect(screen.getByRole('button', { name: /templates/i })).toBeInTheDocument();
    });

    it('should render with template icon', () => {
      render(<TemplatePicker {...defaultProps} />);

      expect(screen.getByTestId('DescriptionIcon')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<TemplatePicker {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button', { name: /templates/i })).toBeDisabled();
    });
  });

  describe('menu interaction', () => {
    it('should open menu when button is clicked', async () => {
      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should load templates when menu opens', async () => {
      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSmsService.getTemplates).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
        expect(screen.getByText('Follow Up')).toBeInTheDocument();
      });
    });

    it('should show loading spinner while loading', async () => {
      mockSmsService.getTemplates.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTemplates), 100))
      );

      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should show empty message when no templates exist', async () => {
      mockSmsService.getTemplates.mockResolvedValue([]);

      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('No templates available')).toBeInTheDocument();
      });
    });

    it('should close menu when clicking outside', async () => {
      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click the backdrop to close
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should only load templates once', async () => {
      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });

      // Open menu first time
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Close menu
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });

      // Open menu again
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Should only have been called once
      expect(mockSmsService.getTemplates).toHaveBeenCalledTimes(1);
    });
  });

  describe('template selection', () => {
    it('should call onSelect with substituted body when template is selected', async () => {
      const onSelect = jest.fn();
      render(<TemplatePicker {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Initial Outreach'));

      expect(onSelect).toHaveBeenCalledWith(
        'Hi John Smith, I noticed your property at 123 Main St. Are you interested in selling?'
      );
    });

    it('should close menu after selecting template', async () => {
      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Initial Outreach'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('placeholder substitution', () => {
    it('should substitute all matching placeholders', async () => {
      const onSelect = jest.fn();
      render(<TemplatePicker {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Initial Outreach'));

      const expectedBody = 'Hi John Smith, I noticed your property at 123 Main St. Are you interested in selling?';
      expect(onSelect).toHaveBeenCalledWith(expectedBody);
    });

    it('should leave unmatched placeholders as-is', async () => {
      const onSelect = jest.fn();
      const variables: TemplateVariables = {
        name: 'Jane Doe',
        // address is missing
      };

      mockSmsService.getTemplates.mockResolvedValue([
        {
          id: 'template-1',
          name: 'Test',
          body: 'Hi {{name}}, property at {{address}}',
          placeholders: ['name', 'address'],
          order: 1,
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
      ]);

      render(<TemplatePicker variables={variables} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Test'));

      // Address placeholder should remain as-is since no value provided
      expect(onSelect).toHaveBeenCalledWith('Hi Jane Doe, property at {{address}}');
    });

    it('should show preview with substituted values in menu', async () => {
      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        // Preview should show substituted text
        expect(screen.getByText(/Hi John Smith, I noticed your property at 123 Main St/)).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSmsService.getTemplates.mockRejectedValue(new Error('Network error'));

      render(<TemplatePicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /templates/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load templates:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
