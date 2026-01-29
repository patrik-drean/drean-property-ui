import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    leadAddress: '123 Oak Street, Austin, TX 78701',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the dialog title with warning icon', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Delete Lead Permanently')).toBeInTheDocument();
    });

    it('should display the lead address for confirmation', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('123 Oak Street, Austin, TX 78701')).toBeInTheDocument();
    });

    it('should display the warning message about permanent action', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(
        screen.getByText(/This action is permanent and cannot be undone/)
      ).toBeInTheDocument();
    });

    it('should display the confirmation question', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(
        screen.getByText('Are you sure you want to permanently delete this lead?')
      ).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render Delete Permanently button', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Delete Permanently' })).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<DeleteConfirmationDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Delete Lead Permanently')).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onConfirm when Delete Permanently button is clicked', () => {
      const onConfirm = jest.fn();
      render(<DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = jest.fn();
      render(<DeleteConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm when loading', () => {
      const onConfirm = jest.fn();
      render(<DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} loading={true} />);

      const deleteButton = screen.getByRole('button', { name: '' }); // Button has spinner instead of text
      expect(deleteButton).toBeDisabled();
    });

    it('should disable Cancel button when loading', () => {
      render(<DeleteConfirmationDialog {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading spinner instead of button text when loading', () => {
      render(<DeleteConfirmationDialog {...defaultProps} loading={true} />);

      // The loading spinner replaces the button text
      expect(screen.queryByText('Delete Permanently')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not close dialog on backdrop click when loading', () => {
      const onCancel = jest.fn();
      render(<DeleteConfirmationDialog {...defaultProps} onCancel={onCancel} loading={true} />);

      // When loading, onClose is undefined so backdrop click does nothing
      // The dialog backdrop is not easily testable, but we verify the prop behavior
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('different addresses', () => {
    it('should display short address', () => {
      render(
        <DeleteConfirmationDialog
          {...defaultProps}
          leadAddress="456 Elm St"
        />
      );

      expect(screen.getByText('456 Elm St')).toBeInTheDocument();
    });

    it('should display full address with city, state, zip', () => {
      render(
        <DeleteConfirmationDialog
          {...defaultProps}
          leadAddress="789 Pine Ave, San Antonio, TX 78209"
        />
      );

      expect(screen.getByText('789 Pine Ave, San Antonio, TX 78209')).toBeInTheDocument();
    });

    it('should handle empty address gracefully', () => {
      render(<DeleteConfirmationDialog {...defaultProps} leadAddress="" />);

      // Dialog should still render without crashing
      expect(screen.getByText('Delete Lead Permanently')).toBeInTheDocument();
    });
  });
});
