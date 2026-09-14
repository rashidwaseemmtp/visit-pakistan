interface ContentErrorStateProps {
  readonly detail?: string;
}

export function ContentErrorState({ detail }: ContentErrorStateProps) {
  return (
    <div className="content-error" role="alert">
      <h2 className="content-error__title">We can’t show the destinations right now</h2>
      <p className="content-error__body">
        The destination content could not be loaded, so the list is unavailable. Please try again later.
      </p>
      {detail ? <p className="content-error__detail">Technical detail: {detail}</p> : null}
    </div>
  );
}
