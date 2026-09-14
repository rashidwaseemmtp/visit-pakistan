import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DestinationList } from './DestinationList';

const destinations = [
  { slug: 'fairy-meadows', name: 'Fairy Meadows' },
  { slug: 'hunza', name: 'Hunza' },
  { slug: 'mohenjo-daro', name: 'Mohenjo-daro' },
];

describe('DestinationList', () => {
  it('renders one list entry per destination, in the order given', () => {
    render(<DestinationList destinations={destinations} />);

    const list = screen.getByRole('list', { name: 'Destinations' });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(Array.from(list.querySelectorAll('h2')).map((heading) => heading.textContent)).toEqual([
      'Fairy Meadows',
      'Hunza',
      'Mohenjo-daro',
    ]);
  });

  it('states the empty case rather than rendering an empty list', () => {
    render(<DestinationList destinations={[]} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('There are no destinations to show at the moment.')).toBeInTheDocument();
  });
});
