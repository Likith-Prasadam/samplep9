export const normalizeVideoName = (name: string): string => {
  if (!name) return '';

  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const areVideoNamesEquivalent = (
  name1: string,
  name2: string
): boolean => {
  return normalizeVideoName(name1) === normalizeVideoName(name2);
};

export const findDuplicateVideoNames = (names: string[]): string[][] => {
  const normalizedToOriginal = new Map<string, string[]>();

  names.forEach((name) => {
    const normalized = normalizeVideoName(name);
    if (normalized) {
      if (!normalizedToOriginal.has(normalized)) {
        normalizedToOriginal.set(normalized, []);
      }
      normalizedToOriginal.get(normalized)!.push(name);
    }
  });

  return Array.from(normalizedToOriginal.values()).filter(
    (group) => group.length > 1
  );
};
