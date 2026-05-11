export const defaultPromptContent = `No data available`;

export const sanitizeForMarkdown = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\_/g, '_')
    .replace(/<\s*\/\s*([\w-]+)\s*>/g, '&lt;/$1&gt;')
    .replace(/<\s*([\w-]+)\s*>/g, '&lt;$1&gt;')
    .replace(/<\s*\/\s*([\w-]+)\s*>/g, '``</$1>``')
    .replace(/<\s*([\w-]+)\s*>/g, '``<$1>``')
    .replace(/\n\d+\.\s*\n/g, (match) => match.replace(/\n/g, ' '))
    .trim();
};

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
