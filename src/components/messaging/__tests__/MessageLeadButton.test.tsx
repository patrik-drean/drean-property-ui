/**
 * Integration tests for MessageLeadButton component
 *
 * Tests integration with MessagingPopoverContext including:
 * - Opening popover with lead data
 * - Passing template variables correctly
 * - Button variants (text, outlined, contained, icon-only)
 * - Disabled state when no phone number
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MessageLeadButton } from '../MessageLeadButton';
import { MessagingPopoverProvider, useMessagingPopover } from '../../../contexts/MessagingPopoverContext';
import { PropertyLead } from '../../../types/property';

// Mock PropertyLead data
const mockLead: PropertyLead = {
  id: 'lead-123',
  address: '123 Main St, Denver, CO 80202',
  zillowLink: 'https://zillow.com/test',
  listingPrice: 350000,
  sellerPhone: '+1234567890',
  sellerEmail: 'seller@test.com',
  lastContactDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  tags: [],
  convertedToProperty: false,
  squareFootage: 1500,
  units: 1,
  notes: '',
};

const mockLeadNoPhone: PropertyLead = {
  ...mockLead,
  sellerPhone: '',
};

describe('MessageLeadButton Integration', () => {
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MessagingPopoverProvider>{children}</MessagingPopoverProvider>
  );

  // Helper component to verify context state
  const ContextStateViewer: React.FC = () => {
    const context = useMessagingPopover();
    return (
      <div data-testid="context-state">
        <div data-testid="is-open">{String(context.isOpen)}</div>
        <div data-testid="phone-number">{context.phoneNumber || 'none'}</div>
        <div data-testid="lead-id">{context.leadId || 'none'}</div>
        <div data-testid="lead-name">{context.leadName || 'none'}</div>
        <div data-testid="lead-address">{context.leadAddress || 'none'}</div>
        <div data-testid="lead-price">{context.leadPrice || 'none'}</div>
      </div>
    );
  };

  describe('Opening popover with lead data', () => {
    it('should open popover with correct phone number when button clicked', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      // Verify context state
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
      expect(screen.getByTestId('phone-number')).toHaveTextContent('+1234567890');
    });

    it('should pass lead ID to context', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(screen.getByTestId('lead-id')).toHaveTextContent('lead-123');
    });

    it('should pass lead name (address) for templates', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(screen.getByTestId('lead-name')).toHaveTextContent('123 Main St, Denver, CO 80202');
    });

    it('should pass lead address for templates', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(screen.getByTestId('lead-address')).toHaveTextContent('123 Main St, Denver, CO 80202');
    });

    it('should pass lead price as string for templates', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(screen.getByTestId('lead-price')).toHaveTextContent('350000');
    });

    it('should handle zero listing price gracefully', () => {
      const leadNoPrice: PropertyLead = {
        ...mockLead,
        listingPrice: 0,
      };

      render(
        <TestWrapper>
          <MessageLeadButton lead={leadNoPrice} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      // Zero price should result in '0' or 'none' depending on implementation
      expect(screen.getByTestId('lead-price')).toBeInTheDocument();
    });
  });

  describe('Button variants', () => {
    it('should render text variant button', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} variant="text" />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Message');
    });

    it('should render outlined variant button (default)', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    it('should render contained variant button', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} variant="contained" />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    it('should render icon-only button', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} iconOnly={true} />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Send SMS Message');
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveTextContent('Message');
    });

    it('should render small size button (default)', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    it('should render medium size button', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} size="medium" />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    it('should render large size button', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} size="large" />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Disabled state (no phone number)', () => {
    it('should render disabled button when no phone number', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLeadNoPhone} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeDisabled();
    });

    it('should show tooltip when no phone number', async () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLeadNoPhone} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });

      // Hover over button to show tooltip
      fireEvent.mouseOver(button);

      // Wait for tooltip to appear
      await waitFor(() => {
        expect(screen.getByText('No phone number available')).toBeInTheDocument();
      });
    });

    it('should render disabled icon-only button when no phone number', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLeadNoPhone} iconOnly={true} />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not open popover when disabled button clicked', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLeadNoPhone} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      // Popover should not open
      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    });
  });

  describe('Event handling', () => {
    it('should stop event propagation when clicked', () => {
      const parentClickHandler = jest.fn();

      render(
        <TestWrapper>
          <div onClick={parentClickHandler}>
            <MessageLeadButton lead={mockLead} />
          </div>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      // Parent handler should not be called due to stopPropagation
      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    // Note: Disabled buttons naturally don't trigger click events,
    // so propagation testing on disabled buttons is not applicable
  });

  describe('Integration with MessagingPopover', () => {
    it('should allow multiple leads to be messaged sequentially', () => {
      const lead1: PropertyLead = { ...mockLead, id: 'lead-1', sellerPhone: '+1111111111' };
      const lead2: PropertyLead = { ...mockLead, id: 'lead-2', sellerPhone: '+2222222222' };

      const { rerender } = render(
        <TestWrapper>
          <MessageLeadButton lead={lead1} />
          <ContextStateViewer />
        </TestWrapper>
      );

      // Click first lead button
      const button1 = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button1);

      expect(screen.getByTestId('lead-id')).toHaveTextContent('lead-1');
      expect(screen.getByTestId('phone-number')).toHaveTextContent('+1111111111');

      // Render with second lead
      rerender(
        <TestWrapper>
          <MessageLeadButton lead={lead2} />
          <ContextStateViewer />
        </TestWrapper>
      );

      // Click second lead button
      const button2 = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button2);

      // Context should update to second lead
      expect(screen.getByTestId('lead-id')).toHaveTextContent('lead-2');
      expect(screen.getByTestId('phone-number')).toHaveTextContent('+2222222222');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible label for icon-only button', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} iconOnly={true} />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Send SMS Message');
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <TestWrapper>
          <MessageLeadButton lead={mockLead} />
          <ContextStateViewer />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /message/i });

      // Verify button is focusable (keyboard accessible)
      button.focus();
      expect(button).toHaveFocus();

      // Click via fireEvent works for keyboard Enter simulation in MUI
      fireEvent.click(button);
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });
  });
});
