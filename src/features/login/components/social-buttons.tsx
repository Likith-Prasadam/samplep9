import { Button } from '@/components/ui/button';
import { useMicrosoftSSO } from '@/hooks/use-microsoft-sso';

export function SocialButtons() {
  const { initiateMicrosoftLogin, loading } = useMicrosoftSSO();

  const handleGoogleLogin = () => {
    // Implement Google OAuth
    console.log('Google login clicked');
  };

  const handleMicrosoftLogin = () => {
    initiateMicrosoftLogin();
  };

  return (
    <>
      {/* Social Login Buttons */}
      <div className="grid grid-rows-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={handleGoogleLogin}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          <span>Login with Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-center border-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300 group"
          onClick={handleMicrosoftLogin}
          disabled={loading}
        >
          <svg
            className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Microsoft logo - four squares */}
            <path
              d="M0 0h10.5v10.5H0V0zm11.5 0H24v10.5H11.5V0zM0 11.5h10.5V24H0V11.5zm11.5 0H24V24H11.5V11.5z"
              className="group-hover:drop-shadow-lg transition-all duration-300"
            />
          </svg>
          <span>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Authenticating...
              </span>
            ) : (
              'Login with Microsoft'
            )}
          </span>
        </Button>
      </div>

      {/* Signup Footer */}
      <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
        Don't have an account?{' '}
        <a
          href="/signup"
          className="text-[#06b6d4] hover:text-[#0891b2] font-medium transition-colors"
        >
          Sign up
        </a>
      </div>
    </>
  );
}
