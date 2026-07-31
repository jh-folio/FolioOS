export function MobileAgentScene({ character, status }: { character?: React.ReactNode; status: string }) {
  return (
    <section className="mobile-agent-scene" aria-label={`현재 Agent 상태: ${status}`}>
      <div>{character}</div>
      <span>
        <small>Agent status</small>
        <strong>{status}</strong>
      </span>
    </section>
  );
}

