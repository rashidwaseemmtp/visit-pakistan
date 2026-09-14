import { useEffect } from 'react';

interface ContentErrorStateProps {
  /** Never rendered: schema paths and messages go to the console, not to the visitor. */
  readonly detail?: string;
}

export function ContentErrorState({ detail }: ContentErrorStateProps) {
  useEffect(() => {
    if (detail) {
      console.error(`Visit Pakistan: the destination content could not be loaded — ${detail}`);
    }
  }, [detail]);

  return (
    <div className="content-error" role="alert">
      <h2 className="content-error__title">We can’t show the destinations right now</h2>
      <p className="content-error__body">
        The destination content could not be loaded, so the list is unavailable. Please try again later.
      </p>
    </div>
  );
}
