import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineEdit } from '../InlineEdit';
import { formatCurrency, parseCurrency, validateCurrency } from '../../../../utils/currencyUtils';

describe('InlineEdit', () => {
  const defaultProps = {
    label: 'Test Label',
    value: 150000,
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('View Mode', () => {
    it('renders label', () => {
      render(<InlineEdit {...defaultProps} />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders value', () => {
      render(<InlineEdit {...defaultProps} />);
      expect(screen.getByText('150000')).toBeInTheDocument();
    });

    it('renders formatted value when formatValue provided', () => {
      render(<InlineEdit {...defaultProps} formatValue={formatCurrency} />);
      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });

    it('renders edit button', () => {
      render(<InlineEdit {...defaultProps} />);
      expect(screen.getByLabelText('Edit Test Label')).toBeInTheDocument();
    });

    it('does not render edit button when disabled', () => {
      render(<InlineEdit {...defaultProps} disabled />);
      expect(screen.queryByLabelText('Edit Test Label')).not.toBeInTheDocument();
    });

    it('renders confidence badge when confidence is provided', () => {
      render(<InlineEdit {...defaultProps} confidence={85} source="ai" />);
      expect(screen.getByText('AI - 85% Confidence')).toBeInTheDocument();
    });

    it('renders manual override badge', () => {
      render(<InlineEdit {...defaultProps} source="manual" />);
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
    });

    it('renders rentcast badge', () => {
      render(<InlineEdit {...defaultProps} source="rentcast" />);
      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
    });

    it('renders note when provided', () => {
      render(<InlineEdit {...defaultProps} note="Adjusted for corner lot" />);
      expect(screen.getByText(/Adjusted for corner lot/)).toBeInTheDocument();
    });

    it('does not render note when not provided', () => {
      render(<InlineEdit {...defaultProps} />);
      expect(screen.queryByText(/Note:/)).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('switches to edit mode when edit button is clicked', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });

    it('shows Save and Cancel buttons in edit mode', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows note textarea in edit mode', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      expect(screen.getByPlaceholderText('Reason for change (optional)')).toBeInTheDocument();
    });

    it('shows info alert in edit mode', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      expect(screen.getByText('MAO will recalculate automatically')).toBeInTheDocument();
    });

    it('shows custom info message', () => {
      render(<InlineEdit {...defaultProps} infoMessage="Custom message" />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('prefills input with current value', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      const input = screen.getByPlaceholderText('Enter value') as HTMLInputElement;
      expect(input.value).toBe('150000');
    });

    it('focuses input when entering edit mode', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      const input = screen.getByPlaceholderText('Enter value');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Save functionality', () => {
    it('calls onSave with new value when Save clicked', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '175000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith('175000', undefined);
    });

    it('calls onSave with parsed value when parseValue provided', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} parseValue={parseCurrency} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '$175,000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith(175000, undefined);
    });

    it('calls onSave with note when note provided', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '175000' },
      });
      fireEvent.change(screen.getByPlaceholderText('Reason for change (optional)'), {
        target: { value: 'Corner lot premium' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith('175000', 'Corner lot premium');
    });

    it('returns to view mode after save', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.click(screen.getByText('Save'));
      expect(screen.queryByPlaceholderText('Enter value')).not.toBeInTheDocument();
    });
  });

  describe('Cancel functionality', () => {
    it('returns to view mode when Cancel clicked', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText('Enter value')).not.toBeInTheDocument();
    });

    it('does not call onSave when Cancel clicked', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '175000' },
      });
      fireEvent.click(screen.getByText('Cancel'));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('resets value when Cancel clicked', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '175000' },
      });
      fireEvent.click(screen.getByText('Cancel'));
      // Re-enter edit mode
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      const input = screen.getByPlaceholderText('Enter value') as HTMLInputElement;
      expect(input.value).toBe('150000');
    });

    it('clears note when Cancel clicked', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Reason for change (optional)'), {
        target: { value: 'Some note' },
      });
      fireEvent.click(screen.getByText('Cancel'));
      // Re-enter edit mode
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      const noteInput = screen.getByPlaceholderText(
        'Reason for change (optional)'
      ) as HTMLTextAreaElement;
      expect(noteInput.value).toBe('');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('saves on Enter key', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.keyDown(screen.getByPlaceholderText('Enter value'), { key: 'Enter' });
      expect(onSave).toHaveBeenCalled();
    });

    it('does not save on Shift+Enter', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.keyDown(screen.getByPlaceholderText('Enter value'), {
        key: 'Enter',
        shiftKey: true,
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it('cancels on Escape key', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.keyDown(screen.getByPlaceholderText('Enter value'), { key: 'Escape' });
      expect(screen.queryByPlaceholderText('Enter value')).not.toBeInTheDocument();
    });

    it('handles Enter key in note field', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.keyDown(screen.getByPlaceholderText('Reason for change (optional)'), {
        key: 'Enter',
      });
      expect(onSave).toHaveBeenCalled();
    });

    it('handles Escape key in note field', () => {
      render(<InlineEdit {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.keyDown(screen.getByPlaceholderText('Reason for change (optional)'), {
        key: 'Escape',
      });
      expect(screen.queryByPlaceholderText('Reason for change (optional)')).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation error when validation fails', () => {
      render(
        <InlineEdit
          {...defaultProps}
          validate={(v) => (Number(v) < 10000 ? 'Value too low' : null)}
        />
      );
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '5000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(screen.getByText('Value too low')).toBeInTheDocument();
    });

    it('does not call onSave when validation fails', () => {
      const onSave = jest.fn();
      render(
        <InlineEdit
          {...defaultProps}
          onSave={onSave}
          validate={(v) => (Number(v) < 10000 ? 'Value too low' : null)}
        />
      );
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '5000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('stays in edit mode when validation fails', () => {
      render(
        <InlineEdit
          {...defaultProps}
          validate={(v) => (Number(v) < 10000 ? 'Value too low' : null)}
        />
      );
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '5000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });

    it('clears error when value changes', () => {
      render(
        <InlineEdit
          {...defaultProps}
          validate={(v) => (Number(v) < 10000 ? 'Value too low' : null)}
        />
      );
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '5000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(screen.getByText('Value too low')).toBeInTheDocument();
      // Change value
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '15000' },
      });
      expect(screen.queryByText('Value too low')).not.toBeInTheDocument();
    });

    it('clears error on cancel', () => {
      render(
        <InlineEdit
          {...defaultProps}
          validate={(v) => (Number(v) < 10000 ? 'Value too low' : null)}
        />
      );
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '5000' },
      });
      fireEvent.click(screen.getByText('Save'));
      fireEvent.click(screen.getByText('Cancel'));
      // Re-enter edit mode
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      expect(screen.queryByText('Value too low')).not.toBeInTheDocument();
    });

    it('works with currency validation', () => {
      render(
        <InlineEdit
          {...defaultProps}
          parseValue={parseCurrency}
          validate={(v) => validateCurrency(Number(v), 10000, 5000000)}
        />
      );
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '$5,000' },
      });
      fireEvent.click(screen.getByText('Save'));
      expect(screen.getByText('Value must be at least $10,000')).toBeInTheDocument();
    });
  });

  describe('Value updates', () => {
    it('updates edit value when external value changes', () => {
      const { rerender } = render(<InlineEdit {...defaultProps} value={150000} />);
      rerender(<InlineEdit {...defaultProps} value={200000} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      const input = screen.getByPlaceholderText('Enter value') as HTMLInputElement;
      expect(input.value).toBe('200000');
    });

    it('does not update edit value when in edit mode', () => {
      const { rerender } = render(<InlineEdit {...defaultProps} value={150000} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.change(screen.getByPlaceholderText('Enter value'), {
        target: { value: '175000' },
      });
      // External value changes
      rerender(<InlineEdit {...defaultProps} value={200000} />);
      const input = screen.getByPlaceholderText('Enter value') as HTMLInputElement;
      // Should keep the user's input
      expect(input.value).toBe('175000');
    });
  });

  describe('Edge cases', () => {
    it('handles string value', () => {
      render(<InlineEdit {...defaultProps} value="Test String" />);
      expect(screen.getByText('Test String')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      render(<InlineEdit {...defaultProps} value={0} formatValue={formatCurrency} />);
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('handles empty note being saved as undefined', () => {
      const onSave = jest.fn();
      render(<InlineEdit {...defaultProps} onSave={onSave} />);
      fireEvent.click(screen.getByLabelText('Edit Test Label'));
      fireEvent.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith('150000', undefined);
    });
  });
});
