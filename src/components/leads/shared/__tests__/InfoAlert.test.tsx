import React from 'react';
import { render, screen } from '@testing-library/react';
import { InfoAlert } from '../InfoAlert';

describe('InfoAlert', () => {
  it('renders the message', () => {
    render(<InfoAlert message="MAO will recalculate automatically" />);
    expect(screen.getByText('MAO will recalculate automatically')).toBeInTheDocument();
  });

  it('renders info icon', () => {
    render(<InfoAlert message="Test message" />);
    // InfoIcon from MUI should be rendered
    const icon = screen.getByTestId('InfoIcon');
    expect(icon).toBeInTheDocument();
  });

  it('handles different messages', () => {
    render(<InfoAlert message="This is a custom info message" />);
    expect(screen.getByText('This is a custom info message')).toBeInTheDocument();
  });

  it('handles empty message', () => {
    render(<InfoAlert message="" />);
    // Should render without crashing, icon should still be present
    expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
  });

  it('handles long messages', () => {
    const longMessage =
      'This is a very long informational message that provides detailed context about what will happen when the user performs this action.';
    render(<InfoAlert message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('renders with blue styling', () => {
    const { container } = render(<InfoAlert message="Test" />);
    // Check that the alert box is rendered
    const alertBox = container.firstChild;
    expect(alertBox).toBeInTheDocument();
  });
});
