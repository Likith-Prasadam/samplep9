interface ChatModelOption {
  modelHash: string;
  modelName: string;
}

const normalizeModelName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

const isExplicitDevEnvironment = (env: string) =>
  env === 'dev' || env === 'development' || env.includes('dev');

const isExplicitUatEnvironment = (env: string) =>
  env === 'uat' || env.includes('uat');

export const getEnvironmentDefaultChatModelName = (): string | null => {
  const explicitOverride = (
    import.meta.env.VITE_DEFAULT_CHAT_MODEL_NAME || ''
  ).trim();
  if (explicitOverride) return explicitOverride;

  const env = (
    import.meta.env.VITE_APP_ENV ||
    import.meta.env.VITE_ENVIRONMENT ||
    import.meta.env.MODE ||
    ''
  )
    .toString()
    .toLowerCase()
    .trim();

  if (isExplicitDevEnvironment(env)) return 'spectra-chat-large';
  if (isExplicitUatEnvironment(env)) return 'spectra-chat-premium';

  return null;
};

export const selectDefaultChatModelHash = (
  models: ChatModelOption[],
  preferredModelHash?: string
): string => {
  if (!models.length) return '';

  if (
    preferredModelHash &&
    models.some((model) => model.modelHash === preferredModelHash)
  ) {
    return preferredModelHash;
  }

  const environmentDefault = getEnvironmentDefaultChatModelName();
  if (environmentDefault) {
    const normalizedDefault = normalizeModelName(environmentDefault);
    const envMatch = models.find(
      (model) => normalizeModelName(model.modelName) === normalizedDefault
    );
    if (envMatch) return envMatch.modelHash;
  }

  return models[0].modelHash;
};
