import LoginForm from '@/features/login/components/login-form';

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center">
      <div className="w-full">
        <LoginForm />
      </div>
    </div>
  );
}
