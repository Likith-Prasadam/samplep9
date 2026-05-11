import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRoleSpecificLogin } from '@/hooks/use-role-specific-login';
import { useTheme } from '@/providers/theme-provider';
import type { LoginResponse, UserRoleCohortItem } from '../types/types';
import LogoLight from '@/assets/p9-logo-light.png';
import LogoDark from '@/assets/p9-logo-dark.png';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [roles, setRoles] = useState<Map<string, UserRoleCohortItem>>(
    new Map()
  );
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackTheme, setFallbackTheme] = useState<'light' | 'dark'>('light');

  const { loading, executeQuery } = useRoleSpecificLogin(setErrorMessage);

  useEffect(() => {
    const loginResponseStr = localStorage.getItem('loginResponse');
    const selectionToken = localStorage.getItem('selection_token');

    if (!loginResponseStr || !selectionToken) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const loginResponse: LoginResponse = JSON.parse(loginResponseStr);
      const roleList = new Map(
        Object.entries(loginResponse.userRoleCohortList)
      );
      setRoles(roleList);

      if (roleList.size === 1) {
        const firstHash = roleList.keys().next().value;
        if (firstHash !== undefined) {
          setSelectedHash(firstHash);
        }
      }
    } catch (error) {
      console.error('Failed to parse login response:', error);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setFallbackTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setFallbackTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const effectiveTheme =
    theme.theme && ['light', 'dark'].includes(theme.theme)
      ? theme.theme
      : fallbackTheme;

  const handleSelectRole = (hash: string) => {
    setSelectedHash(hash);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (!selectedHash) {
      setErrorMessage('Please select a role');
      return;
    }

    const token = localStorage.getItem('selection_token');
    console.log('🔑 Role Selection - Before sending query:', {
      selectedHash,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 50) + '...' : 'MISSING',
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem('selected_role_hash', selectedHash);

    setErrorMessage(null);
    executeQuery({
      variables: { userRoleCohortHash: selectedHash },
    });
  };

  if (roles.size === 0) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center">
        <Card className="mx-auto w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="w-full relative z-10">
        <Card className="mx-auto w-full max-w-2xl backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            <div className="text-center space-y-4 mb-10">
              <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl shadow-2xl ">
                <img
                  src={effectiveTheme === 'dark' ? LogoLight : LogoDark}
                  alt="App Logo"
                  className="h-10 w-10 transition-all duration-300 animate-zoom"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-blue-600 mb-2">
                  Select Your Role
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Choose your role and cohort to access your workspace
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {Array.from(roles.entries()).map(([hash, roleData], index) => (
                <div
                  key={hash}
                  onClick={() => handleSelectRole(hash)}
                  className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-102 ${
                    selectedHash === hash
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30 shadow-lg shadow-blue-500/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg'
                  }`}
                  style={{
                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-400/10 to-purple-400/10 dark:from-blue-500/5 dark:to-purple-500/5 pointer-events-none`}
                  />

                  <div className="relative flex items-center gap-4">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
                        selectedHash === hash
                          ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50'
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500'
                      }`}
                    >
                      {selectedHash === hash && (
                        <svg
                          className="w-3 h-3 text-white animate-pulse"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          {roleData.role}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                          />
                        </svg>
                        {roleData.cohort}
                      </p>
                    </div>

                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${selectedHash === hash ? 'text-blue-500' : 'text-gray-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 border-2 border-red-300 dark:border-red-800/50 rounded-xl flex items-start gap-3 animate-shake">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-800 dark:text-red-200 font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            <Button
              onClick={handleConfirm}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedHash}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Confirming Role...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Continue to Dashboard</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-shake {
          animation: shake 0.5s;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        @keyframes zoomInOut {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

.animate-zoom {
  animation: zoomInOut 2.5s ease-in-out infinite;
}

      `}</style>
    </div>
  );
}
