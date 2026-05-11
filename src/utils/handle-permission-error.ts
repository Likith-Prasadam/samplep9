import { toast } from 'sonner';

export function handlePermissionError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  const code = extractErrorCode(error);

  if (
    code === 'FORBIDDEN' ||
    code === 'UNAUTHENTICATED' ||
    /permission denied/i.test(message) ||
    /not authorized/i.test(message) ||
    /access denied/i.test(message) ||
    /you do not have permission/i.test(message)
  ) {
    toast.error('You are not an admin to perform this operation', {
      position: 'bottom-center',
      duration: 4000,
    });
    return true;
  }

  return false;
}

export function handleApiError(
  error: unknown,
  fallbackMessage = 'An error occurred'
): void {
  if (handlePermissionError(error)) return;

  const message = extractErrorMessage(error) || fallbackMessage;
  toast.error(message, {
    position: 'bottom-center',
    duration: 4000,
  });
}

function extractErrorMessage(error: unknown): string {
  if (!error) return '';

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    if (Array.isArray(err.graphQLErrors) && err.graphQLErrors.length > 0) {
      return (err.graphQLErrors[0] as Record<string, unknown>)
        .message as string;
    }

    if (typeof err.message === 'string') return err.message;
  }

  if (typeof error === 'string') return error;

  return '';
}

function extractErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';

  const err = error as Record<string, unknown>;

  if (Array.isArray(err.graphQLErrors) && err.graphQLErrors.length > 0) {
    const gqlError = err.graphQLErrors[0] as Record<string, unknown>;
    const extensions = gqlError.extensions as
      | Record<string, unknown>
      | undefined;
    if (extensions && typeof extensions.code === 'string') {
      return extensions.code;
    }
  }

  if (
    err.extensions &&
    typeof (err.extensions as Record<string, unknown>).code === 'string'
  ) {
    return (err.extensions as Record<string, unknown>).code as string;
  }

  return '';
}
