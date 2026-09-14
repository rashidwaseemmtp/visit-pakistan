import type { Destination } from '../content/schema';
import { DestinationCard } from './DestinationCard';

interface DestinationListProps {
  readonly destinations: readonly Destination[];
}

export function DestinationList({ destinations }: DestinationListProps) {
  if (destinations.length === 0) {
    return <p className="destination-list__empty">There are no destinations to show at the moment.</p>;
  }

  return (
    <ul className="destination-list" aria-label="Destinations">
      {destinations.map((destination) => (
        <li className="destination-list__item" key={destination.slug}>
          <DestinationCard destination={destination} />
        </li>
      ))}
    </ul>
  );
}
