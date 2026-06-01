"use client";

import * as React from "react";

// Minimal markdown renderer (no deps). Handles: code blocks, inline code, bold, italic,
// headings, lists, paragraphs, links — enough for chat-style output.

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  // Order matters: code > bold > italic > link
  const patterns: { regex: RegExp; render: (m: RegExpExecArray) => React.ReactNode }[] = [
    {
      regex: /`([^`]+)`/g,
      render: (m) => <code key={`c${key++}`}>{m[1]}</code>,
    },
    {
      regex: /\*\*([^*]+)\*\*/g,
      render: (m) => <strong key={`b${key++}`}>{m[1]}</strong>,
    },
    {
      regex: /\*([^*]+)\*/g,
      render: (m) => <em key={`i${key++}`}>{m[1]}</em>,
    },
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/g,
      render: (m) => (
        <a key={`l${key++}`} href={m[2]} target="_blank" rel="noreferrer">{m[1]}</a>
      ),
    },
  ];

  let remaining = text;
  while (remaining) {
    let earliest: { idx: number; match: RegExpExecArray; pat: typeof patterns[number] } | null = null;
    for (const pat of patterns) {
      pat.regex.lastIndex = 0;
      const m = pat.regex.exec(remaining);
      if (m && (!earliest || m.index < earliest.idx)) earliest = { idx: m.index, match: m, pat };
    }
    if (!earliest) {
      nodes.push(remaining);
      break;
    }
    if (earliest.idx > 0) nodes.push(remaining.slice(0, earliest.idx));
    nodes.push(earliest.pat.render(earliest.match));
    remaining = remaining.slice(earliest.idx + earliest.match[0].length);
    i++;
    if (i > 2000) break;
  }
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const start = i + 1;
      let end = start;
      while (end < lines.length && !lines[end].startsWith("```")) end++;
      const code = lines.slice(start, end).join("\n");
      blocks.push(
        <pre key={`p${key++}`} data-lang={lang}>
          <code>{code}</code>
        </pre>,
      );
      i = end + 1;
      continue;
    }

    // Heading
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const Tag = (`h${Math.min(level + 1, 4)}` as unknown) as keyof React.JSX.IntrinsicElements;
      blocks.push(<Tag key={`h${key++}`}>{renderInline(h[2])}</Tag>);
      i++;
      continue;
    }

    // List (consecutive)
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (
        i < lines.length &&
        ((!ordered && /^\s*[-*]\s+/.test(lines[i])) || (ordered && /^\s*\d+\.\s+/.test(lines[i])))
      ) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={`l${key++}`}>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </Tag>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (group consecutive non-empty)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^#{1,3}\s+/.test(lines[i]) && !lines[i].startsWith("```") && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={`pp${key++}`}>{renderInline(para.join(" "))}</p>);
  }

  return <div className="prose-chat">{blocks}</div>;
}
