import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ErrorAlert } from './error-alert';
import { SocialButtons } from './social-buttons';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { useLoginQuery } from '@/hooks/use-login-mutation';
import { loginSchema, type LoginFormData } from '../types/schema';
import { LoginFields } from './login-fields';

import LogoLight from '@/assets/p9-logo-light.png';
import LogoDark from '@/assets/p9-logo-dark.png';
import { useTheme } from '@/providers/theme-provider';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const theme = useTheme();

  useAuthRedirect();

  const setLoginError = useCallback((msg: string) => {
    setErrorMessage(msg);
  }, []);

  const { loading, login } = useLoginQuery(setLoginError);

  // Fallback theme detection for consistency
  const [fallbackTheme, setFallbackTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setFallbackTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setFallbackTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Memoized effective theme: prefer provider value, fallback to media query
  const effectiveTheme = useMemo(() => {
    // If provider theme is invalid/undefined, use fallback
    return theme.theme && ['light', 'dark'].includes(theme.theme)
      ? theme.theme
      : fallbackTheme;
  }, [theme.theme, fallbackTheme]);

  const methods = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: LoginFormData) => {
    setErrorMessage(null);
    login(data.username, data.password);
  };

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="p-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              {/* ---- LOGO ---- */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 dark:bg-[#0f0f0f]/80 shadow-lg shadow-black/30">
                <img
                  src={effectiveTheme === 'dark' ? LogoLight : LogoDark}
                  alt="App Logo"
                  className="h-10 w-10 transition-all duration-300"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Welcome back
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in to your account
              </p>
            </div>

            {/* Rest of your form unchanged */}
            <LoginFields
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
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
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign In</span>
                </div>
              )}
            </Button>

            {errorMessage && <ErrorAlert message={errorMessage} />}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/50 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/60 dark:bg-[#0f0f0f]/80 text-gray-500 dark:text-gray-400 backdrop-blur-sm rounded-full">
                  OR
                </span>
              </div>
            </div>

            <SocialButtons />
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
