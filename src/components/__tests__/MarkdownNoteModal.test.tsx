import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MarkdownNoteModal } from '../MarkdownNoteModal';

const theme = createTheme();

// Mock react-markdown and remark-gfm to avoid ESM issues
// The mock renders children as plain text which is sufficient for testing component behavior
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

// Helper to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MarkdownNoteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('Rendering and Display', () => {
    it('should render in view mode by default', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="# Test Note"
          title="Test Title"
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit')).toBeInTheDocument();
      expect(screen.queryByLabelText('View')).not.toBeInTheDocument();
    });

    it('should render content in markdown container', () => {
      const markdownContent = 'Test content';

      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent={markdownContent}
        />
      );

      const container = screen.getByTestId('markdown-content');
      expect(container).toHaveTextContent('Test content');
    });

    it('should show empty state when no content', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent=""
        />
      );

      expect(screen.getByText('No notes yet')).toBeInTheDocument();
      expect(screen.getByText('Click Edit to add your property notes')).toBeInTheDocument();
    });

    it('should use default title when not provided', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="test"
        />
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to edit mode when Edit button clicked', async () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="# Test"
        />
      );

      const editButton = screen.getByLabelText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText('View')).toBeInTheDocument();
        expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
      });

      // Should show textarea in edit mode
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('# Test');
    });

    it('should switch to view mode when View button clicked', async () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="# Test"
        />
      );

      // Switch to edit mode
      fireEvent.click(screen.getByLabelText('Edit'));

      await waitFor(() => {
        expect(screen.getByLabelText('View')).toBeInTheDocument();
      });

      // Switch back to view mode
      fireEvent.click(screen.getByLabelText('View'));

      await waitFor(() => {
        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should show textarea in edit mode', async () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Initial content"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('Initial content');
      });
    });
  });

  describe('Editing and Saving', () => {
    it('should update content when typing in edit mode', async () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent=""
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));

      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New content' } });

      expect(textarea).toHaveValue('New content');
    });

    it('should call onSave with updated content when Save clicked', async () => {
      mockOnSave.mockResolvedValue(undefined);

      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Initial"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));

      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('Updated content');
      });
    });

    it('should switch to view mode after successful save', async () => {
      mockOnSave.mockResolvedValue(undefined);

      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));
      await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });

    it('should show "Saving..." text while saving', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));
      await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable View button while saving', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));
      await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Save'));

      const viewButton = screen.getByLabelText('View');
      expect(viewButton).toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should reset content when Cancel clicked', async () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Original"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));

      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Modified' } });

      fireEvent.click(screen.getByText('Cancel'));

      // Switch back to edit to verify content was reset
      fireEvent.click(screen.getByLabelText('Edit'));
      const resetTextarea = await screen.findByRole('textbox');
      expect(resetTextarea).toHaveValue('Original');
    });

    it('should return to view mode when Cancel clicked', async () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));
      await waitFor(() => expect(screen.getByText('Cancel')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy content to clipboard when copy button clicked', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Content to copy"
        />
      );

      fireEvent.click(screen.getByLabelText('Copy to clipboard'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Content to copy');
    });
  });

  describe('Modal Close Behavior', () => {
    it('should close modal when Close button clicked in view mode', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      fireEvent.click(screen.getByText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });


    it('should close without confirmation if no changes made in view mode', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      // Close directly from view mode
      fireEvent.click(screen.getByText('Close'));

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('State Reset on Open', () => {
    it('should reset content when modal reopens', () => {
      const { rerender } = renderWithTheme(
        <MarkdownNoteModal
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Initial"
        />
      );

      // Open modal
      rerender(
        <ThemeProvider theme={theme}>
          <MarkdownNoteModal
            open={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            initialContent="Initial"
          />
        </ThemeProvider>
      );

      expect(screen.getByText('Initial')).toBeInTheDocument();

      // Close modal
      rerender(
        <ThemeProvider theme={theme}>
          <MarkdownNoteModal
            open={false}
            onClose={mockOnClose}
            onSave={mockOnSave}
            initialContent="Initial"
          />
        </ThemeProvider>
      );

      // Reopen with new content
      rerender(
        <ThemeProvider theme={theme}>
          <MarkdownNoteModal
            open={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            initialContent="Updated"
          />
        </ThemeProvider>
      );

      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('should reset to view mode when modal reopens', () => {
      const { rerender } = renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Test"
        />
      );

      // Enter edit mode
      fireEvent.click(screen.getByLabelText('Edit'));

      // Close and reopen
      rerender(
        <ThemeProvider theme={theme}>
          <MarkdownNoteModal
            open={false}
            onClose={mockOnClose}
            onSave={mockOnSave}
            initialContent="Test"
          />
        </ThemeProvider>
      );

      rerender(
        <ThemeProvider theme={theme}>
          <MarkdownNoteModal
            open={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            initialContent="Test"
          />
        </ThemeProvider>
      );

      // Should be in view mode
      expect(screen.getByLabelText('Edit')).toBeInTheDocument();
      expect(screen.queryByLabelText('View')).not.toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display content in markdown container', () => {
      renderWithTheme(
        <MarkdownNoteModal
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialContent="Sample markdown content"
        />
      );

      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Sample markdown content');
    });
  });
});
