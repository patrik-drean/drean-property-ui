import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoGalleryPanel } from '../PhotoGalleryPanel';
import { QueueLead } from '../../../../types/queue';

describe('PhotoGalleryPanel', () => {
  const createMockLead = (overrides: Partial<QueueLead> = {}): QueueLead => ({
    id: 'lead-1',
    address: '123 Main Street',
    city: 'San Antonio',
    state: 'TX',
    zipCode: '78209',
    zillowLink: 'https://zillow.com/test',
    listingPrice: 150000,
    sellerPhone: '555-1234',
    sellerEmail: 'seller@test.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    tags: [],
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    units: 1,
    notes: '',
    leadScore: 8,
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
    photoUrl: 'https://example.com/photo1.jpg',
    photoUrls: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
    ],
    ...overrides,
  });

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the property address', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });

    it('should display the current photo', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      const img = screen.getByAltText('Property photo 1');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('should display photo counter', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should display thumbnails for all photos', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/);
      expect(thumbnails).toHaveLength(3);
    });

    it('should display keyboard hints', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      expect(screen.getByText(/← → Navigate/)).toBeInTheDocument();
      expect(screen.getByText(/ESC Close/)).toBeInTheDocument();
    });

    it('should return null if no photos', () => {
      const { container } = render(
        <PhotoGalleryPanel
          lead={createMockLead({ photoUrl: undefined, photoUrls: [] })}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should use single photoUrl if photoUrls is empty', () => {
      render(
        <PhotoGalleryPanel
          lead={createMockLead({
            photoUrl: 'https://example.com/single.jpg',
            photoUrls: [],
          })}
          onClose={mockOnClose}
        />
      );

      const img = screen.getByAltText('Property photo 1');
      expect(img).toHaveAttribute('src', 'https://example.com/single.jpg');
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to next photo when right arrow is clicked', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // Initially showing photo 1
      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      // Click next button
      const nextButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowRightIcon"]')
      );
      expect(nextButton).toBeDefined();
      fireEvent.click(nextButton!);

      // Now showing photo 2
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous photo when left arrow is clicked', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // Click next to go to photo 2
      const nextButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowRightIcon"]')
      );
      fireEvent.click(nextButton!);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Click previous to go back to photo 1
      const prevButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowLeftIcon"]')
      );
      fireEvent.click(prevButton!);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should wrap to last photo when navigating previous from first', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // At photo 1, click previous
      const prevButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowLeftIcon"]')
      );
      fireEvent.click(prevButton!);

      // Should wrap to photo 3
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should wrap to first photo when navigating next from last', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // Navigate to last photo
      const nextButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowRightIcon"]')
      );
      fireEvent.click(nextButton!); // 2
      fireEvent.click(nextButton!); // 3
      expect(screen.getByText('3 / 3')).toBeInTheDocument();

      // Click next again
      fireEvent.click(nextButton!);

      // Should wrap to photo 1
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should navigate to specific photo when thumbnail is clicked', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // Click on thumbnail 3
      const thumbnail3 = screen.getByAltText('Thumbnail 3');
      fireEvent.click(thumbnail3);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should not show navigation arrows for single photo', () => {
      render(
        <PhotoGalleryPanel
          lead={createMockLead({
            photoUrls: ['https://example.com/single.jpg'],
          })}
          onClose={mockOnClose}
        />
      );

      const prevButton = screen.queryAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowLeftIcon"]')
      );
      const nextButton = screen.queryAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="KeyboardArrowRightIcon"]')
      );

      expect(prevButton).toBeUndefined();
      expect(nextButton).toBeUndefined();
    });
  });

  describe('keyboard navigation', () => {
    it('should navigate to next photo with ArrowRight key', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous photo with ArrowLeft key', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // First go to photo 2
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Then go back to photo 1
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should close gallery with Escape key', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not navigate when typing in input', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      // Simulate keydown on an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowRight' });

      // Should still be on photo 1
      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      document.body.removeChild(input);
    });
  });

  describe('close button', () => {
    it('should call onClose when close button is clicked', () => {
      render(<PhotoGalleryPanel lead={createMockLead()} onClose={mockOnClose} />);

      const closeButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[data-testid="CloseIcon"]')
      );
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('lead change', () => {
    it('should reset to first photo when lead changes', () => {
      const lead1 = createMockLead({ id: 'lead-1' });
      const lead2 = createMockLead({ id: 'lead-2' });

      const { rerender } = render(
        <PhotoGalleryPanel lead={lead1} onClose={mockOnClose} />
      );

      // Navigate to photo 3
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByText('3 / 3')).toBeInTheDocument();

      // Change lead
      rerender(<PhotoGalleryPanel lead={lead2} onClose={mockOnClose} />);

      // Should reset to photo 1
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });
});
