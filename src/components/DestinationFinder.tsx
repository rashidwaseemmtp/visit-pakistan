import { useMemo, useRef, useState } from 'react';
import {
  NO_CRITERIA,
  collectFilterOptions,
  describeActiveCriteria,
  describeAvailableControls,
  filterDestinations,
  formatResultCount,
  hasActiveCriteria,
  type DestinationCriteria,
} from '../content/filters';
import type { Destination } from '../content/schema';
import { DestinationList } from './DestinationList';

interface DestinationFinderProps {
  readonly destinations: readonly Destination[];
}

interface FacetFilterProps {
  readonly id: string;
  readonly label: string;
  readonly unfilteredLabel: string;
  readonly options: readonly string[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/**
 * Options come from the values present in data/destinations.json. A field the content file
 * carries no values for has nothing to offer, so its control is left out entirely — the same
 * rule DestinationCard applies to an absent fact, rather than a dead, empty select.
 */
function FacetFilter({ id, label, unfilteredLabel, options, value, onChange }: FacetFilterProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="destination-finder__field">
      <label className="destination-finder__label" htmlFor={id}>
        {label}
      </label>
      <select
        className="destination-finder__select"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{unfilteredLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DestinationFinder({ destinations }: DestinationFinderProps) {
  const [criteria, setCriteria] = useState<DestinationCriteria>(NO_CRITERIA);
  const searchField = useRef<HTMLInputElement>(null);

  const provinces = useMemo(() => collectFilterOptions(destinations, 'province'), [destinations]);
  const categories = useMemo(() => collectFilterOptions(destinations, 'category'), [destinations]);
  const matching = useMemo(() => filterDestinations(destinations, criteria), [destinations, criteria]);

  function update(change: Partial<DestinationCriteria>) {
    setCriteria((current) => ({ ...current, ...change }));
  }

  function clearCriteria() {
    setCriteria(NO_CRITERIA);
    // The clear control unmounts once there is nothing left to clear, so focus is moved
    // deliberately rather than dropped onto the document.
    searchField.current?.focus();
  }

  // Nothing to search: the list states the content-level empty case on its own.
  if (destinations.length === 0) {
    return <DestinationList destinations={destinations} />;
  }

  const activeCriteria = describeActiveCriteria(criteria);
  const canClear = hasActiveCriteria(criteria);
  const noMatches = matching.length === 0;

  /**
   * The same two option lists that decide whether each FacetFilter renders also decide what
   * the copy above the controls promises, so the page can never tell a visitor to narrow by
   * a filter it does not show. With the content file as committed — names only — this reads
   * "Search the list by destination name." and names no filter at all.
   */
  const availableFacets = [
    provinces.length > 0 ? 'province' : undefined,
    categories.length > 0 ? 'category' : undefined,
  ].filter((facet): facet is string => facet !== undefined);

  /**
   * One clear control, in one of two places, decided by one pair of flags: with the controls
   * while there are results, and inside the empty state when there are none, so the way out
   * sits with the message that explains why the list is empty. The two guards below read
   * `canClear && !noMatches` and `canClear && noMatches`, so they cannot both render it and
   * cannot both skip it while a criterion is active. DestinationFinder.test.tsx asserts the
   * count in both branches, and `noMatches` cannot occur with no criteria active — with none
   * every destination matches, and the no-content case returned above.
   */
  const clearControl = (
    <button className="destination-finder__clear" type="button" onClick={clearCriteria}>
      Clear search and filters
    </button>
  );

  return (
    <div className="destination-finder">
      <p className="destination-finder__hint">{describeAvailableControls(availableFacets)}</p>

      {/* Nothing is submitted: filtering happens as the visitor types, and the site's CSP
          sets form-action 'none'. The form element is here for the search landmark. */}
      <form
        className="destination-finder__controls"
        role="search"
        aria-label="Search and filter destinations"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="destination-finder__field">
          <label className="destination-finder__label" htmlFor="destination-search">
            Search destinations
          </label>
          <input
            className="destination-finder__input"
            id="destination-search"
            type="search"
            autoComplete="off"
            ref={searchField}
            value={criteria.searchTerm}
            onChange={(event) => update({ searchTerm: event.target.value })}
          />
        </div>
        <FacetFilter
          id="destination-province"
          label="Province"
          unfilteredLabel="All provinces"
          options={provinces}
          value={criteria.province}
          onChange={(province) => update({ province })}
        />
        <FacetFilter
          id="destination-category"
          label="Category"
          unfilteredLabel="All categories"
          options={categories}
          value={criteria.category}
          onChange={(category) => update({ category })}
        />
        {canClear && !noMatches ? clearControl : null}
      </form>

      {/* role="status" is an implicit polite live region, so a change in the number of
          results is announced without moving focus. */}
      <p className="destination-finder__count" role="status">
        {formatResultCount(matching.length, destinations.length)}
      </p>

      {noMatches ? (
        <div className="destination-finder__empty">
          <h2 className="destination-finder__empty-title">No destinations match</h2>
          <p className="destination-finder__empty-body">
            No destination matches all of these at once:
          </p>
          {/* Named, so the criteria that produced the empty result are announced as a list
              rather than as loose text after the message. */}
          <ul className="destination-finder__criteria" aria-label="Active search and filter criteria">
            {activeCriteria.map((criterion) => (
              <li className="destination-finder__criterion" key={criterion.label}>
                <span className="destination-finder__criterion-label">{criterion.label}</span>{' '}
                <span className="destination-finder__criterion-value">{criterion.value}</span>
              </li>
            ))}
          </ul>
          {canClear ? clearControl : null}
        </div>
      ) : (
        <DestinationList destinations={matching} />
      )}
    </div>
  );
}
