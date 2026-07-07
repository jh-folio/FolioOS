type MarkdownRendererProps = {
  markdown?: string;
};

type InlinePart =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string };

function inlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    if (match[2]) parts.push({ type: "strong", value: match[2] });
    else if (match[3]) parts.push({ type: "code", value: match[3] });
    else if (match[4] && match[5]) parts.push({ type: "link", label: match[4], href: match[5] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

function renderInline(text: string) {
  return inlineParts(text).map((part, index) => {
    if (part.type === "strong") return <strong key={index}>{part.value}</strong>;
    if (part.type === "code") return <code key={index}>{part.value}</code>;
    if (part.type === "link") {
      return (
        <a key={index} href={part.href} target="_blank" rel="noreferrer">
          {part.label}
        </a>
      );
    }
    return <span key={index}>{part.value}</span>;
  });
}

function flushParagraph(buffer: string[], nodes: JSX.Element[]) {
  if (!buffer.length) return;
  nodes.push(<p key={`p-${nodes.length}`}>{renderInline(buffer.join(" "))}</p>);
  buffer.length = 0;
}

export function MarkdownRenderer({ markdown = "" }: MarkdownRendererProps) {
  const nodes: JSX.Element[] = [];
  const paragraph: string[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let listItems: string[] = [];

  function flushList() {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {listItems.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
      </ul>,
    );
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph(paragraph, nodes);
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph(paragraph, nodes);
      flushList();
      const level = heading[1].length;
      const content = renderInline(heading[2]);
      if (level === 2) nodes.push(<h2 key={`h-${nodes.length}`}>{content}</h2>);
      else if (level === 3) nodes.push(<h3 key={`h-${nodes.length}`}>{content}</h3>);
      else nodes.push(<h4 key={`h-${nodes.length}`}>{content}</h4>);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph(paragraph, nodes);
      listItems.push(bullet[1]);
      continue;
    }

    paragraph.push(trimmed);
  }
  flushParagraph(paragraph, nodes);
  flushList();

  return <div className="react-markdown markdown-brief report-body">{nodes}</div>;
}
