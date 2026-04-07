/**
 * Badge Components Tests
 * 
 * Basic tests to verify badge components render correctly
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeCard } from './BadgeCard';

describe('BadgeCard', () => {
  it('renders badge name and description', () => {
    const badge = {
      id: '1',
      name: 'Test Badge',
      description: 'Test Description',
      category: 'coding',
      rarityLevel: 'common' as const,
      iconUrl: 'https://example.com/icon.png',
    };

    render(<BadgeCard badge={badge} />);
    
    expect(screen.getByText('Test Badge')).toBeDefined();
    expect(screen.getByText('Test Description')).toBeDefined();
  });

  it('displays rarity level', () => {
    const badge = {
      id: '1',
      name: 'Epic Badge',
      description: 'An epic achievement',
      category: 'events',
      rarityLevel: 'epic' as const,
      iconUrl: 'https://example.com/icon.png',
    };

    render(<BadgeCard badge={badge} />);
    
    expect(screen.getByText('Epic')).toBeDefined();
  });

  it('shows rare achievement indicator when specified', () => {
    const badge = {
      id: '1',
      name: 'Rare Badge',
      description: 'Very rare',
      category: 'special',
      rarityLevel: 'legendary' as const,
      iconUrl: 'https://example.com/icon.png',
    };

    render(
      <BadgeCard 
        badge={badge} 
        earnedAt={new Date()} 
        isRareAchievement={true} 
      />
    );
    
    expect(screen.getByText('Rare Achievement')).toBeDefined();
  });
});
