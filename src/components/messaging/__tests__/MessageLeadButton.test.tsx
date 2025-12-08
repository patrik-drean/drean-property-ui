import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyLead } from '../../../types/property';

// Mock navigate function
const mockNavigate = jest.fn();

// Mock react-router-dom before importing components that use it
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

import { MessageLeadButton } from '../MessageLeadButton';

const createLead = (overrides: Partial<PropertyLead> = {}): PropertyLead => ({
  id: 'lead-123',
  address: '123 Main St',
  city: 'Test City',
  state: 'CA',
  zipCode: '12345',
  listingPrice: 500000,
  status: 'new',
  sellerPhone: '+15551234567',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('MessageLeadButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with phone number', () => {
    it('should render button with Message text by default', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} />);

      expect(screen.getByRole('button', { name: /message/i })).toBeInTheDocument();
    });

    it('should render enabled button', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).not.toBeDisabled();
    });

    it('should navigate to messaging page on click', () => {
      const lead = createLead({ id: 'lead-456', sellerPhone: '+15559876543' });
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/messaging?phone=%2B15559876543&lead=lead-456'
      );
    });

    it('should stop event propagation on click', () => {
      const lead = createLead();
      const parentClickHandler = jest.fn();

      render(
        <div onClick={parentClickHandler}>
          <MessageLeadButton lead={lead} />
        </div>
      );

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('should render icon button when iconOnly is true', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} iconOnly />);

      // Should not have text
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
      // Should have SMS icon
      expect(screen.getByTestId('SmsIcon')).toBeInTheDocument();
    });

    it('should navigate when icon button clicked', () => {
      const lead = createLead({ id: 'lead-789', sellerPhone: '+15551112222' });
      render(<MessageLeadButton lead={lead} iconOnly />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/messaging?phone=%2B15551112222&lead=lead-789'
      );
    });

    it('should show tooltip on icon button hover', async () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} iconOnly />);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      // Tooltip content is rendered
      expect(await screen.findByText('Send SMS Message')).toBeInTheDocument();
    });
  });

  describe('without phone number', () => {
    it('should render disabled button', () => {
      const lead = createLead({ sellerPhone: undefined });
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeDisabled();
    });

    it('should render disabled button when phone is empty string', () => {
      const lead = createLead({ sellerPhone: '' });
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeDisabled();
    });

    it('should not navigate when disabled button clicked', () => {
      const lead = createLead({ sellerPhone: undefined });
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show tooltip explaining disabled state', async () => {
      const lead = createLead({ sellerPhone: undefined });
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.mouseEnter(button.parentElement!);

      expect(await screen.findByText('No phone number available')).toBeInTheDocument();
    });

    it('should render disabled icon button when iconOnly is true', () => {
      const lead = createLead({ sellerPhone: undefined });
      render(<MessageLeadButton lead={lead} iconOnly />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show tooltip on disabled icon button hover', async () => {
      const lead = createLead({ sellerPhone: undefined });
      render(<MessageLeadButton lead={lead} iconOnly />);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button.parentElement!);

      expect(await screen.findByText('No phone number available')).toBeInTheDocument();
    });
  });

  describe('button variants', () => {
    it('should accept variant prop', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} variant="contained" />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-contained');
    });

    it('should accept size prop', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} size="medium" />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-sizeMedium');
    });

    it('should default to outlined variant', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-outlined');
    });

    it('should default to small size', () => {
      const lead = createLead();
      render(<MessageLeadButton lead={lead} />);

      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-sizeSmall');
    });
  });
});
