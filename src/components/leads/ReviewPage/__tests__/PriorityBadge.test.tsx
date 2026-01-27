import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';

describe('PriorityBadge', () => {
  it('should render URGENT label', () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('should render HIGH label', () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should render MEDIUM label', () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should render NORMAL label', () => {
    render(<PriorityBadge priority="normal" />);
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('should render time since when provided', () => {
    render(<PriorityBadge priority="urgent" timeSince="2h ago" />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('should not render time since when not provided', () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  it('should render both priority and time', () => {
    render(<PriorityBadge priority="high" timeSince="30m ago" />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('30m ago')).toBeInTheDocument();
  });
});
