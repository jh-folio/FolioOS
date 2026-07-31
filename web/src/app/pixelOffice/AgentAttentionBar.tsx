import type { AgentAttentionItem } from "./useAgentAttention";

export function AgentAttentionBar({
  items,
  onAcknowledge,
  onAcknowledgeAll,
  onOpenAgent,
}: {
  items: AgentAttentionItem[];
  onAcknowledge: (id: string) => void;
  onAcknowledgeAll: () => void;
  onOpenAgent: () => void;
}) {
  if (!items.length) return null;
  return (
    <section className="office-attention" aria-label="확인이 필요한 Agent 알림" aria-live="polite">
      <header>
        <strong>확인할 항목 {items.length}건</strong>
        <button type="button" onClick={onAcknowledgeAll}>모두 확인</button>
      </header>
      {items.slice(0, 3).map((item) => (
        <div key={item.id} data-tone={item.tone}>
          <button type="button" onClick={onOpenAgent}>{item.label}</button>
          <button type="button" onClick={() => onAcknowledge(item.id)} aria-label={`${item.label} 확인 처리`}>×</button>
        </div>
      ))}
    </section>
  );
}

