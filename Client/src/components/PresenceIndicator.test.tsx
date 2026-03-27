import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresenceIndicator } from './PresenceIndicator';
import { ActivityItem } from './ActivityItem';
import type { ActivityEvent } from '@/lib/services/activity-service';

// Mock the services
vi.mock('@/lib/services/presence-service', () => ({
  getPresenceService: () => ({
    getUserStatus: vi.fn(() => 'online'),
    formatLastSeen: vi.fn(() => '5 minutes ago'),
    onUserStatusChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
  }),
}));

describe('Real-Time Components', () => {
  describe('PresenceIndicator', () => {
    it('renders with online status', () => {
      render(<PresenceIndicator userId="test-user" />);
      // Component should render without errors
      expect(document.querySelector('.bg-green-500')).toBeTruthy();
    });

    it('shows last seen when showLastSeen is true', () => {
      render(<PresenceIndicator userId="test-user" showLastSeen={true} />);
      // Should render the component
      expect(document.querySelector('.text-xs')).toBeTruthy();
    });

    it('renders different sizes correctly', () => {
      const { rerender } = render(<PresenceIndicator userId="test-user" size="sm" />);
      expect(document.querySelector('.w-2')).toBeTruthy();
      
      rerender(<PresenceIndicator userId="test-user" size="lg" />);
      expect(document.querySelector('.w-4')).toBeTruthy();
    });
  });

  describe('ActivityItem', () => {
    const mockActivity: ActivityEvent = {
      id: 'activity-1',
      type: 'challenge_solved',
      userId: 'user-1',
      username: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
      metadata: {
        challengeName: 'SQL Injection Challenge',
      },
      createdAt: new Date(),
      isPending: false,
    };

    it('renders activity with correct type icon', () => {
      render(<ActivityItem activity={mockActivity} />);
      // Should render trophy icon for challenge_solved
      expect(document.querySelector('.text-yellow-500')).toBeTruthy();
    });

    it('displays username and action description', () => {
      render(<ActivityItem activity={mockActivity} />);
      expect(screen.getByText('testuser')).toBeTruthy();
      expect(screen.getByText(/solved/)).toBeTruthy();
    });

    it('shows pending indicator when isPending is true', () => {
      const pendingActivity = { ...mockActivity, isPending: true };
      const { container } = render(<ActivityItem activity={pendingActivity} />);
      // Check for the absolute positioned div that contains the loader
      const pendingIndicator = container.querySelector('.absolute.top-2.right-2');
      expect(pendingIndicator).toBeTruthy();
    });

    it('displays metadata correctly', () => {
      render(<ActivityItem activity={mockActivity} />);
      expect(screen.getByText('SQL Injection Challenge')).toBeTruthy();
    });
  });
});
