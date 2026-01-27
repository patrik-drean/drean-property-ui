import React from 'react';
import { render, screen } from '@testing-library/react';
import { AiSuggestionPreview } from '../AiSuggestionPreview';
import { AiSuggestion } from '../../../../types/queue';

describe('AiSuggestionPreview', () => {
  const mockSuggestion: AiSuggestion = {
    templateName: 'Quick Cash Offer',
    messagePreview: 'Hi there! I noticed your property at 123 Main St and would love to discuss a quick cash offer...',
    confidence: 85,
  };

  describe('rendering', () => {
    it('should display AI Suggestion label', () => {
      render(<AiSuggestionPreview suggestion={mockSuggestion} />);

      expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
    });

    it('should display template name', () => {
      render(<AiSuggestionPreview suggestion={mockSuggestion} />);

      expect(screen.getByText('Quick Cash Offer')).toBeInTheDocument();
    });

    it('should display confidence percentage', () => {
      render(<AiSuggestionPreview suggestion={mockSuggestion} />);

      expect(screen.getByText('85% confident')).toBeInTheDocument();
    });

    it('should display message preview', () => {
      render(<AiSuggestionPreview suggestion={mockSuggestion} />);

      expect(screen.getByText(mockSuggestion.messagePreview)).toBeInTheDocument();
    });
  });

  describe('different confidence levels', () => {
    it('should display 100% confidence', () => {
      const highConfidence: AiSuggestion = {
        ...mockSuggestion,
        confidence: 100,
      };

      render(<AiSuggestionPreview suggestion={highConfidence} />);

      expect(screen.getByText('100% confident')).toBeInTheDocument();
    });

    it('should display low confidence', () => {
      const lowConfidence: AiSuggestion = {
        ...mockSuggestion,
        confidence: 70,
      };

      render(<AiSuggestionPreview suggestion={lowConfidence} />);

      expect(screen.getByText('70% confident')).toBeInTheDocument();
    });
  });

  describe('different template names', () => {
    it('should display Follow-Up template', () => {
      const followUpSuggestion: AiSuggestion = {
        templateName: 'Follow-Up Reminder',
        messagePreview: 'Just checking in about the property...',
        confidence: 90,
      };

      render(<AiSuggestionPreview suggestion={followUpSuggestion} />);

      expect(screen.getByText('Follow-Up Reminder')).toBeInTheDocument();
    });

    it('should display Negotiation template', () => {
      const negotiationSuggestion: AiSuggestion = {
        templateName: 'Price Negotiation',
        messagePreview: 'Thank you for considering our offer...',
        confidence: 78,
      };

      render(<AiSuggestionPreview suggestion={negotiationSuggestion} />);

      expect(screen.getByText('Price Negotiation')).toBeInTheDocument();
    });
  });

  describe('long message preview', () => {
    it('should render long message preview text', () => {
      const longMessage: AiSuggestion = {
        templateName: 'Initial Contact',
        messagePreview: 'This is a very long message preview that goes on and on and on and should be truncated by CSS styling because it is way too long to fit in a small preview box. It continues with more text here.',
        confidence: 82,
      };

      render(<AiSuggestionPreview suggestion={longMessage} />);

      // The component should still render the full text (CSS handles truncation)
      expect(screen.getByText(longMessage.messagePreview)).toBeInTheDocument();
    });
  });

  describe('special characters', () => {
    it('should handle special characters in template name', () => {
      const specialSuggestion: AiSuggestion = {
        templateName: 'Quick & Easy Offer!',
        messagePreview: 'Contact us today...',
        confidence: 88,
      };

      render(<AiSuggestionPreview suggestion={specialSuggestion} />);

      expect(screen.getByText('Quick & Easy Offer!')).toBeInTheDocument();
    });

    it('should handle special characters in message preview', () => {
      const specialSuggestion: AiSuggestion = {
        templateName: 'Standard Offer',
        messagePreview: 'We can offer $50,000 - $75,000 for your property & close quickly!',
        confidence: 75,
      };

      render(<AiSuggestionPreview suggestion={specialSuggestion} />);

      expect(screen.getByText(specialSuggestion.messagePreview)).toBeInTheDocument();
    });
  });
});
