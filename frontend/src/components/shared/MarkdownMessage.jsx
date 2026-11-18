import React, { useState } from 'react';
import { IconCopy, IconCheck, IconFileText, IconExternalLink } from './HomeIcons';

/**
 * Format inline markdown tokens: bold, italic, inline code, links
 */
function renderInline(text) {
  if (!text) return null;

  // Split by inline markdown regex patterns
  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`|https?:\/\/[^\s]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Markdown link: [label](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, label, url] = match;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#123b63] hover:text-[#0c2a47] underline underline-offset-2 font-semibold inline-flex items-center gap-0.5 break-all transition-colors"
          >
            <span>{label}</span>
            <IconExternalLink size={12} className="inline flex-shrink-0" />
          </a>
        );
      }
    }

    // 2. Standalone URL: https://...
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#123b63] hover:text-[#0c2a47] underline underline-offset-2 font-semibold inline-flex items-center gap-0.5 break-all transition-colors"
        >
          <span>{part.replace(/^https?:\/\/(www\.)?/, '')}</span>
          <IconExternalLink size={12} className="inline flex-shrink-0" />
        </a>
      );
    }

    // 3. Bold / Important Words: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 4. Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }

    // 5. Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Fenced code block with copy button
 */
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-sm text-xs w-full">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800 text-slate-400 border-b border-slate-700/60">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors text-xs p-1 px-2 rounded hover:bg-slate-700 font-medium"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <IconCheck size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <IconCopy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Table component for Markdown tables
 */
function MarkdownTable({ headers, rows }) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 shadow-2xs w-full">
      <table className="w-full text-left text-xs sm:text-sm border-collapse tabular-nums">
        {headers && headers.length > 0 && (
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-900">
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3 font-semibold whitespace-nowrap text-xs uppercase tracking-wider">
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2.5 px-3 text-slate-700 tabular-nums">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Main Markdown Parser & Renderer component - ChatGPT Style
 */
export default function MarkdownMessage({ content, citations = [] }) {
  if (!content) return null;

  const rawLines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 0. Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code Block (```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      elements.push(
        <CodeBlock key={`code-${i}`} code={codeLines.join('\n')} language={lang} />
      );
      i++; // skip closing ```
      continue;
    }

    // 2. Table Block (lines starting and containing |)
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const isDivider = tableLines[1].replace(/[\s|:-]/g, '').length === 0;
        const rowStartIdx = isDivider ? 2 : 1;
        const bodyRows = tableLines.slice(rowStartIdx).map(tLine =>
          tLine.split('|').slice(1, -1).map(c => c.trim())
        );

        elements.push(
          <MarkdownTable key={`table-${i}`} headers={headerCells} rows={bodyRows} />
        );
        continue;
      }
    }

    // 3. Headings (#, ##, ###, ####)
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="font-bold text-base text-slate-900 mt-4 mb-2 first:mt-0 tracking-tight leading-snug w-full">
          {renderInline(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="font-bold text-sm sm:text-base text-[#123b63] mt-3.5 mb-1.5 first:mt-0 tracking-tight leading-snug w-full">
          {renderInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      const textSlice = line.startsWith('### ') ? line.slice(4) : line.slice(5);
      elements.push(
        <h4 key={`h3-${i}`} className="font-semibold text-sm text-slate-900 mt-3 mb-1 first:mt-0 tracking-tight leading-snug w-full">
          {renderInline(textSlice)}
        </h4>
      );
      i++;
      continue;
    }

    // 4. Blockquotes & Notes (> or Note: / Important: / Warning:)
    if (line.startsWith('> ') || line === '>') {
      const quoteLines = [];
      while (i < rawLines.length && (rawLines[i].startsWith('> ') || rawLines[i] === '>')) {
        quoteLines.push(rawLines[i].startsWith('> ') ? rawLines[i].slice(2) : '');
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-[#123b63] bg-slate-50/90 pl-3.5 pr-3 py-2.5 my-2.5 text-slate-700 rounded-r-md text-sm leading-relaxed w-full border-t border-b border-r border-slate-200/50"
        >
          {renderInline(quoteLines.join(' '))}
        </blockquote>
      );
      continue;
    }
    if (/^(note|important|warning|tip):/i.test(trimmed)) {
      const noteLines = [trimmed];
      i++;
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        !rawLines[i].startsWith('#') &&
        !rawLines[i].startsWith('-') &&
        !rawLines[i].startsWith('*')
      ) {
        noteLines.push(rawLines[i].trim());
        i++;
      }
      elements.push(
        <div
          key={`note-${i}`}
          className="border-l-2 border-amber-600 bg-amber-50/60 pl-3.5 pr-3 py-2.5 my-2.5 text-slate-800 rounded-r-md text-xs sm:text-sm leading-relaxed w-full border-t border-b border-r border-amber-200/60 shadow-2xs"
        >
          {renderInline(noteLines.join(' '))}
        </div>
      );
      continue;
    }

    // 5. Unordered List Items (- or * or •)
    if (/^\s*[-*•]\s+/.test(line)) {
      const listItems = [];
      while (
        i < rawLines.length &&
        (/^\s*[-*•]\s+/.test(rawLines[i]) || (listItems.length > 0 && rawLines[i].startsWith('  ')))
      ) {
        if (/^\s*[-*•]\s+/.test(rawLines[i])) {
          listItems.push(rawLines[i].replace(/^\s*[-*•]\s+/, ''));
        } else {
          listItems[listItems.length - 1] += ' ' + rawLines[i].trim();
        }
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2.5 w-full text-sm text-slate-800">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#123b63] flex-shrink-0 mt-2" />
              <div className="flex-1 min-w-0">{renderInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered List Items (1. )
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (
        i < rawLines.length &&
        (/^\s*\d+\.\s+/.test(rawLines[i]) || (listItems.length > 0 && rawLines[i].startsWith('  ')))
      ) {
        if (/^\s*\d+\.\s+/.test(rawLines[i])) {
          listItems.push(rawLines[i].replace(/^\s*\d+\.\s+/, ''));
        } else {
          listItems[listItems.length - 1] += ' ' + rawLines[i].trim();
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-2.5 w-full text-sm text-slate-800">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed w-full">
              <span className="text-xs font-bold text-[#123b63] bg-blue-50 border border-blue-200/60 rounded px-1.5 min-w-[20px] text-center flex-shrink-0 mt-0.5 tabular-nums">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">{renderInline(item)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }


    // 7. Standalone Title / Section Heading
    if (
      trimmed.length < 55 &&
      !trimmed.endsWith('.') &&
      !trimmed.endsWith(',') &&
      !trimmed.includes('. ') &&
      !trimmed.startsWith('(')
    ) {
      elements.push(
        <h4
          key={`title-${i}`}
          className="font-bold text-sm text-[#123b63] mt-3 mb-1.5 first:mt-0 tracking-tight leading-snug w-full"
        >
          {renderInline(trimmed)}
        </h4>
      );
      i++;
      continue;
    }

    // 8. Continuous Paragraph: Group lines into cohesive paragraphs
    const paraLines = [trimmed];
    i++;
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].startsWith('#') &&
      !/^\s*[-*•]\s+/.test(rawLines[i]) &&
      !/^\s*\d+\.\s+/.test(rawLines[i]) &&
      !rawLines[i].startsWith('>') &&
      !rawLines[i].trim().startsWith('```') &&
      !rawLines[i].trim().startsWith('|') &&
      !/^(note|important|warning|tip):/i.test(rawLines[i].trim())
    ) {
      const nextTrimmed = rawLines[i].trim();
      if (
        nextTrimmed.length < 50 &&
        !nextTrimmed.endsWith('.') &&
        !nextTrimmed.endsWith(',') &&
        !nextTrimmed.includes('. ')
      ) {
        break; // Stop paragraph so title can be its own heading
      }
      paraLines.push(nextTrimmed);
      i++;
    }

    elements.push(
      <p
        key={`p-${i}`}
        className="my-2 text-sm leading-relaxed text-slate-800 w-full break-words first:mt-0 [text-wrap:pretty]"
      >
        {renderInline(paraLines.join(' '))}
      </p>
    );
  }

  return (
    <div className="markdown-content font-sans w-full min-w-0 space-y-1.5 text-sm leading-relaxed break-words text-slate-800">
      {elements}

      {/* Citations / Sources if present */}
      {Array.isArray(citations) && citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/80 w-full">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            <IconFileText size={13} className="text-[#123b63]" />
            <span>Sources & Official Guidelines:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 w-full">
            {citations.map((c, idx) => (
              <span
                key={idx}
                title={c.content_preview || c.section || 'Source reference'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-[#123b63] text-xs font-medium transition-colors border border-slate-200 shadow-2xs cursor-help"
              >
                <span className="font-semibold text-slate-900 text-xs">{c.document_name || `Doc ${idx + 1}`}</span>
                {c.section && <span className="text-slate-500 font-mono text-xs tabular-nums">({c.section})</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
