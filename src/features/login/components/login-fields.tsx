import { Controller, useFormContext } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LoginFormData } from '../types/types';

interface LoginFieldsProps {
  showPassword: boolean;
  onTogglePassword: () => void;
}

export function LoginFields({
  showPassword,
  onTogglePassword,
}: LoginFieldsProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<LoginFormData>();

  return (
    <div className="space-y-4">
      {/* Username Field */}
      <div className="space-y-2">
        <Label htmlFor="username">Email / Username</Label>
        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <Input
              id="username"
              type="text"
              placeholder="username@gmail.com"
              {...field}
              value={field.value || ''}
            />
          )}
        />
        {errors.username && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Input
                {...field}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pr-12"
                value={field.value || ''}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        />
        {errors.password && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end">
        <a
          href="#"
          className="text-sm text-[#818589] hover:text-[#0891b2] dark:text-[#818589] dark:hover:text-[#0891b2] font-medium transition-colors"
        >
          Forgot password?
        </a>
      </div>
    </div>
  );
}
