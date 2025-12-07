import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock react-router-dom before importing components that use it
jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    Link: mockReact.forwardRef(
      ({ children, to }: { children: mockReact.ReactNode; to: string }, ref: any) =>
        mockReact.createElement('a', { href: to, ref }, children)
    ),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });

import { TemplatesPage } from '../TemplatesPage';
import { smsService } from '../../services/smsService';
import { SmsTemplate } from '../../types/sms';

// Mock the SMS service
jest.mock('../../services/smsService');

const mockSmsService = smsService as jest.Mocked<typeof smsService>;

// Test fixtures
const mockTemplates: SmsTemplate[] = [
  {
    id: 'template-1',
    name: 'Initial Outreach',
    body: 'Hi {{name}}, I noticed your property at {{address}}. Are you interested in selling?',
    placeholders: ['name', 'address'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Follow Up',
    body: 'Hi {{name}}, just following up on my previous message.',
    placeholders: ['name'],
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z',
  },
];

const renderComponent = () => {
  return render(<TemplatesPage />);
};

describe('TemplatesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSmsService.getTemplates.mockResolvedValue(mockTemplates);
    mockSmsService.createTemplate.mockResolvedValue(mockTemplates[0]);
    mockSmsService.updateTemplate.mockResolvedValue(mockTemplates[0]);
    mockSmsService.deleteTemplate.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('should render page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Message Templates')).toBeInTheDocument();
      });
    });

    it('should render New Template button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });
    });

    it('should show loading spinner while fetching templates', () => {
      mockSmsService.getTemplates.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTemplates), 100))
      );

      renderComponent();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display templates after loading', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
        expect(screen.getByText('Follow Up')).toBeInTheDocument();
      });
    });

    it('should show empty state when no templates exist', async () => {
      mockSmsService.getTemplates.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No templates yet')).toBeInTheDocument();
        expect(screen.getByText(/Create your first template/i)).toBeInTheDocument();
      });
    });

    it('should display placeholder chips for each template', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('{{name}}')).toHaveLength(2);
        expect(screen.getByText('{{address}}')).toBeInTheDocument();
      });
    });

    it('should show error alert when loading fails', async () => {
      mockSmsService.getTemplates.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
      });
    });
  });

  describe('create template', () => {
    it('should open create dialog when New Template button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Dialog title should be "New Template"
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('New Template');
    });

    it('should have empty form fields in create mode', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      const nameInput = screen.getByLabelText(/template name/i);
      const bodyInput = screen.getByLabelText(/message body/i);

      expect(nameInput).toHaveValue('');
      expect(bodyInput).toHaveValue('');
    });

    it('should disable Save button when fields are empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when fields are filled', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      const nameInput = screen.getByLabelText(/template name/i);
      const bodyInput = screen.getByLabelText(/message body/i);

      await userEvent.type(nameInput, 'New Template');
      await userEvent.type(bodyInput, 'Hello {{name}}');

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should call createTemplate when saving new template', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/template name/i);
      const bodyInput = screen.getByLabelText(/message body/i);

      // Use fireEvent.change for more reliable MUI input handling
      fireEvent.change(nameInput, { target: { value: 'New Template' } });
      fireEvent.change(bodyInput, { target: { value: 'Hello {{name}}' } });

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockSmsService.createTemplate).toHaveBeenCalledWith({
          name: 'New Template',
          body: 'Hello {{name}}',
        });
      });
    });

    it('should close dialog and refresh list after successful creation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      const nameInput = screen.getByLabelText(/template name/i);
      const bodyInput = screen.getByLabelText(/message body/i);

      await userEvent.type(nameInput, 'New Template');
      await userEvent.type(bodyInput, 'Hello {{name}}');

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Should have fetched templates again
      expect(mockSmsService.getTemplates).toHaveBeenCalledTimes(2);
    });

    it('should detect placeholders in body text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const bodyInput = screen.getByLabelText(/message body/i);
      // Use fireEvent.change for complex text with braces
      fireEvent.change(bodyInput, { target: { value: 'Hi {{name}}, property at {{address}}' } });

      await waitFor(() => {
        expect(screen.getByText('Detected placeholders:')).toBeInTheDocument();
      });

      // Check placeholder chips are shown
      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('address')).toBeInTheDocument();
      });
    });
  });

  describe('edit template', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit template');
      await userEvent.click(editButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Template')).toBeInTheDocument();
    });

    it('should pre-fill form with existing template data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit template');
      await userEvent.click(editButtons[0]);

      const nameInput = screen.getByLabelText(/template name/i);
      const bodyInput = screen.getByLabelText(/message body/i);

      expect(nameInput).toHaveValue('Initial Outreach');
      expect(bodyInput).toHaveValue(mockTemplates[0].body);
    });

    it('should call updateTemplate when saving edited template', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit template');
      await userEvent.click(editButtons[0]);

      const nameInput = screen.getByLabelText(/template name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockSmsService.updateTemplate).toHaveBeenCalledWith('template-1', {
          name: 'Updated Name',
          body: mockTemplates[0].body,
        });
      });
    });
  });

  describe('delete template', () => {
    it('should open delete confirmation dialog when delete button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByText('Delete Template')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this template/i)).toBeInTheDocument();
    });

    it('should call deleteTemplate when confirming deletion', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await userEvent.click(deleteButtons[0]);

      // Click the Delete button in confirmation dialog
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockSmsService.deleteTemplate).toHaveBeenCalledWith('template-1');
      });
    });

    it('should close dialog when cancelling deletion', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await userEvent.click(deleteButtons[0]);

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument();
      });

      expect(mockSmsService.deleteTemplate).not.toHaveBeenCalled();
    });

    it('should refresh list after successful deletion', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await userEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        // Should have fetched templates again after deletion
        expect(mockSmsService.getTemplates).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('dialog cancel', () => {
    it('should close create dialog when Cancel is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should clear form data when dialog is closed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      // Open and fill in data
      await userEvent.click(screen.getByRole('button', { name: /new template/i }));
      const nameInput = screen.getByLabelText(/template name/i);
      await userEvent.type(nameInput, 'Test');

      // Cancel
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Open again
      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should be empty
      const newNameInput = screen.getByLabelText(/template name/i);
      expect(newNameInput).toHaveValue('');
    });
  });

  describe('error handling', () => {
    it('should show error when save fails', async () => {
      mockSmsService.createTemplate.mockRejectedValue({
        response: { data: 'Template name already exists' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new template/i }));

      const nameInput = screen.getByLabelText(/template name/i);
      const bodyInput = screen.getByLabelText(/message body/i);

      await userEvent.type(nameInput, 'Duplicate Name');
      await userEvent.type(bodyInput, 'Hello');

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText('Template name already exists')).toBeInTheDocument();
      });
    });

    it('should show error when delete fails', async () => {
      mockSmsService.deleteTemplate.mockRejectedValue(new Error('Server error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await userEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete template')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should have breadcrumb navigation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Messaging')).toBeInTheDocument();
        expect(screen.getByText('Templates')).toBeInTheDocument();
      });
    });

    it('should have back button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
      });
    });
  });
});
