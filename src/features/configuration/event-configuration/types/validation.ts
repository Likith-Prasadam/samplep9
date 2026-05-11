export const MAX_EVENT_LENGTH = 1000;

export const VALID_INPUT_REGEX = /^[a-zA-Z\s.,'-]*$/;

export const validateEventName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Event name cannot be empty';
  }

  if (name.length > MAX_EVENT_LENGTH) {
    return `Event must be ${MAX_EVENT_LENGTH} characters or less`;
  }

  if (!VALID_INPUT_REGEX.test(name)) {
    return 'Event cannot contain numbers or special characters';
  }

  return null;
};

export const validateEvents = (names: string[]): string | null => {
  if (names.length === 0) {
    return 'Please enter at least one event';
  }

  for (const name of names) {
    const error = validateEventName(name);
    if (error) return error;
  }

  return null;
};

export const sanitizeInput = (
  value: string,
  maxLength: number = MAX_EVENT_LENGTH
): string => {
  return value.slice(0, maxLength).replace(/[^a-zA-Z\s.,'-]/g, '');
};
