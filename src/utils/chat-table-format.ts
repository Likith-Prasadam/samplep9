const TABLE_SECTION_HEADER_REGEX = /^\s*Element\s+Description\s*$/i;

const shouldStopTableSection = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^key insights?/i.test(trimmed)) return true;
  if (/^[*-]\s+/.test(trimmed) || /^•\s+/.test(trimmed)) return true;
  return false;
};

const parseTableRow = (
  line: string
): { element: string; description: string } | null => {
  const match = line.trimEnd().match(/^(.+?)\s{2,}(.+)$/);
  if (!match) return null;
  return {
    element: match[1].trim(),
    description: match[2].trim(),
  };
};

const escapeCell = (value: string): string =>
  value.replace(/\|/g, '\\|').trim();

const buildMarkdownTable = (
  rows: Array<{ element: string; description: string }>
): string => {
  const tableLines = [
    '| Element | Description |',
    '| --- | --- |',
    ...rows.map(
      (row) => `| ${escapeCell(row.element)} | ${escapeCell(row.description)} |`
    ),
  ];
  return tableLines.join('\n');
};

export const convertElementDescriptionToMarkdownTable = (
  text: string
): string => {
  const lines = text.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i];

    if (!TABLE_SECTION_HEADER_REGEX.test(currentLine)) {
      output.push(currentLine);
      i += 1;
      continue;
    }

    let j = i + 1;
    const rows: Array<{ element: string; description: string }> = [];
    let activeRow: { element: string; description: string } | null = null;

    while (j < lines.length) {
      const line = lines[j];

      if (shouldStopTableSection(line)) break;

      const parsed = parseTableRow(line);
      if (parsed) {
        if (activeRow) rows.push(activeRow);
        activeRow = parsed;
      } else if (activeRow) {
        activeRow.description =
          `${activeRow.description} ${line.trim()}`.trim();
      }

      j += 1;
    }

    if (activeRow) rows.push(activeRow);

    if (rows.length >= 2) {
      output.push(buildMarkdownTable(rows));
    } else {
      output.push(currentLine);
      for (let k = i + 1; k < j; k += 1) output.push(lines[k]);
    }

    i = j;
  }

  return output.join('\n');
};

export const extractTextFromSseDataLines = (text: string): string => {
  if (!text.includes('data:')) return text;

  const lines = text.split(/\r?\n/);
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;

    const dataStr = trimmed.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;

    try {
      const parsed = JSON.parse(dataStr);
      const content = parsed?.choices?.[0]?.delta?.content;
      if (typeof content === 'string' && content.length > 0) {
        parts.push(content);
      }
    } catch {
      // ignore malformed SSE lines; return original text if no valid chunks found
    }
  }

  if (parts.length === 0) return text;
  return parts.join('');
};
