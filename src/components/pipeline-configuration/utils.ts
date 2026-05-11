export const toDisplayName = (raw: string | null | undefined) => {
  if (!raw) return '';
  const overrides: Record<string, string> = {
    event_detection: 'Event detection',
    video_preprocessing: 'Video Processing',
    vlm_inference: 'Transcript Generation',
  };
  if (overrides[raw]) return overrides[raw];

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

/**
 * Converts a process name to internal format (lowercase with underscores)
 * Handles both display names and already-formatted internal names
 * Used for creating prompt types and backend API calls
 */
export const toInternalProcessName = (
  raw: string | null | undefined
): string => {
  if (!raw) return '';

  // If already in internal format (lowercase with underscores, no spaces), return as-is
  if (/^[a-z0-9_]+$/.test(raw)) {
    return raw;
  }

  // Convert display name back to internal format
  // Remove extra spaces, convert to lowercase, replace spaces/hyphens with underscores
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/[^a-z0-9_]/g, ''); // Remove any other special characters
};

export const extractDefaultParams = (
  modelParams?: Record<string, unknown> | null
) => {
  if (!modelParams) return { temperature: 0.1, max_tokens: 1000 };

  if (modelParams.properties && typeof modelParams.properties === 'object') {
    const defaults: Record<string, unknown> = {};
    Object.entries(modelParams.properties).forEach(([key, value]) => {
      if (
        value &&
        typeof value === 'object' &&
        (value as Record<string, unknown>).default !== undefined
      ) {
        defaults[key] = (value as Record<string, unknown>).default;
      }
    });
    return Object.keys(defaults).length > 0
      ? defaults
      : { temperature: 0.1, max_tokens: 1000 };
  }

  return modelParams;
};

export const extractDefaultsFromSchema = (
  schema?: Record<string, unknown> | null | unknown
) => {
  if (!schema || typeof schema !== 'object') return {};
  const schemaObj = schema as Record<string, unknown>;
  if (!schemaObj.properties) return {};
  const defaults: Record<string, unknown> = {};

  Object.entries(schemaObj.properties as Record<string, unknown>).forEach(
    ([key, prop]) => {
      if (key === 'version') return;

      const propObj = prop as Record<string, unknown>;
      if (propObj.default !== undefined) {
        defaults[key] = propObj.default;
      } else if (propObj.type === 'integer' || propObj.type === 'number') {
        if (propObj.minimum !== undefined) {
          defaults[key] = propObj.minimum;
        }
      }

      if (propObj.$ref && schemaObj.$defs) {
        const defName = (propObj.$ref as string).split('/').pop();
        const def = (schemaObj.$defs as Record<string, unknown>)[defName || ''];
        if (def && (def as Record<string, unknown>)?.properties) {
          const nestedDefaults: Record<string, unknown> = {};
          Object.entries(
            (def as Record<string, unknown>).properties as Record<
              string,
              unknown
            >
          ).forEach(([subKey, subProp]) => {
            const subPropObj = subProp as Record<string, unknown>;
            if (subPropObj.default !== undefined) {
              nestedDefaults[subKey] = subPropObj.default;
            } else if (
              subPropObj.type === 'integer' ||
              subPropObj.type === 'number'
            ) {
              if (subPropObj.minimum !== undefined) {
                nestedDefaults[subKey] = subPropObj.minimum;
              }
            }
          });
          if (Object.keys(nestedDefaults).length > 0) {
            defaults[key] = nestedDefaults;
          }
        }
      }
    }
  );
  return defaults;
};

export const formatConfigValue = (key: string, val: unknown): string => {
  if (val === null || val === undefined) return 'Not set';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'None';
    if (val.every((item) => typeof item === 'string')) return val.join(', ');
    return val.map(String).join(', ');
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return 'Empty';
    return entries
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v)}`)
      .join(', ');
  }
  if (typeof val === 'string') {
    if (key.includes('prompt') && val.includes('/')) {
      const parts = val.split('/');
      const lastPart = parts[parts.length - 1];
      return lastPart
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
    }
    return val;
  }
  return String(val);
};

export const formatReviewFieldLabel = (key: string): string => {
  let label = key
    .replace(/^required_/i, '')
    .replace(/_types?$/i, '')
    .replace(/_hash$/i, '')
    .replace(/_/g, ' ');
  label = label.replace(/\b\w/g, (ch) => ch.toUpperCase());
  if (label.toLowerCase().includes('prompt type')) {
    label = label.replace(/Type/i, '').trim() + ' Prompt';
  }
  return label;
};

export const looksLikeHash = (val: string): boolean => {
  const trimmed = val.trim();
  if (trimmed.length < 16) return false;

  // UUID-like
  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed
    );

  // Long hex string
  const hexLike = /^[0-9a-f]+$/i.test(trimmed) && trimmed.length >= 24;

  return uuidLike || hexLike;
};

export const formatDisplayValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';

  // Handle strings
  if (typeof val === 'string') {
    if (looksLikeHash(val)) {
      // Hide internal IDs / hashes in human preview
      return 'Configured';
    }
    return val;
  }

  // Handle numbers and booleans
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);

  // Handle arrays - join with comma
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object') return JSON.stringify(item);
        return String(item);
      })
      .join(', ');
  }

  // Handle objects - extract values only
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>).filter(
      ([key]) => !key.toLowerCase().includes('hash')
    );
    if (entries.length === 0) return '';

    return entries
      .map(([, v]) => {
        if (typeof v === 'string') {
          if (looksLikeHash(v)) return 'Configured';
          return v;
        }
        if (v === null || v === undefined) return '';
        return String(v);
      })
      .filter(Boolean)
      .join(', ');
  }

  return String(val);
};
