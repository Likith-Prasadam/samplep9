import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useMicrosoftSSO } from '@/hooks/use-microsoft-sso';

export default function MicrosoftCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleMicrosoftCallback, loading } = useMicrosoftSSO();
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth error from Microsoft
    if (errorParam) {
      setDisplayError(
        errorDescription || errorParam || 'Authentication failed'
      );
      // Redirect to login after 2 seconds
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Handle successful callback
    if (code && state) {
      handleMicrosoftCallback(code, state);
    } else if (!code || !state) {
      setDisplayError('Invalid callback parameters');
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, handleMicrosoftCallback]);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background animation */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="w-full relative z-10">
        <Card className="mx-auto w-full max-w-md backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl">
          <CardContent className="p-8 text-center">
            {displayError ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <svg
                    className="w-16 h-16 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Authentication Failed
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {displayError}
                  </p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Redirecting to login...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin opacity-75" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-gray-900">
                      <svg
                        className="w-8 h-8 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          stroke="currentColor"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Authenticating with Microsoft
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {loading
                      ? 'Processing your credentials...'
                      : 'Setting up your account...'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
