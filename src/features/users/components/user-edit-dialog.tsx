import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ApolloError } from '@apollo/client';
import { toast } from 'sonner';
import { handlePermissionError } from '@/utils/handle-permission-error';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  UsersUpdateInput,
  User as SharedUser,
} from '@/features/users/types';
import { useUserUpdateMutation } from '@/features/users/hooks/use-user-update-mutation';

export type User = SharedUser;

export interface FormUser {
  user_hash?: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  email_id: string;
  gender: string;
  account_type: string;
  phone_number?: string;
  date_of_birth?: string;
  role_hash?: string;
  role_name?: string;
  is_active?: boolean;
  is_locked?: boolean;
}

interface UserEditFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSave?: (data: FormUser) => void;
  orgCohortHash: string;
}

const schema = yup.object({
  first_name: yup
    .string()
    .required('First name is required')
    .matches(/^[a-zA-Z]+$/, 'First name must contain only alphabets'),
  last_name: yup
    .string()
    .required('Last name is required')
    .matches(/^[a-zA-Z]+$/, 'Last name must contain only alphabets'),
  display_name: yup
    .string()
    .required('User Name is required')
    .test(
      'no-spaces',
      'User Name should not start or end with spaces',
      (value) => {
        if (!value) return false;
        return value === value.trim();
      }
    )
    .test(
      'not-only-numbers',
      'User Name must contain at least one letter (cannot be only numbers)',
      (value) => {
        if (!value) return false;
        return !/^\d+$/.test(value);
      }
    ),
  email_id: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address'
    ),
  gender: yup.string().required('Gender is required'),
  account_type: yup.string().required('Account Type is required'),
  phone_number: yup.string().notRequired(),
  date_of_birth: yup
    .string()
    .notRequired()
    .test(
      'date-complete',
      'Please select a complete date (dd/mm/yyyy)',
      (value) => {
        if (!value) return true;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) return false;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
      }
    ),
  role_id: yup.number().notRequired(),
  role_name: yup.string().notRequired(),
  role_hash: yup.string().notRequired(),
  is_active: yup.boolean().notRequired(),
  is_locked: yup.boolean().notRequired(),
});

export default function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSave,
  orgCohortHash,
}: UserEditFormModalProps) {
  // Get selected role from localStorage for field-level access control
  const selectedRole = (
    localStorage.getItem('selected_role') || 'USER'
  ).toUpperCase();

  const {
    executeMutation,
    isLoading: isMutationLoading,
    isAdmin,
  } = useUserUpdateMutation({
    targetUserHash: user?.user_hash,
    orgCohortHash,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormUser>({
    resolver: yupResolver(schema) as unknown as Resolver<FormUser>,
    defaultValues: {
      first_name: '',
      last_name: '',
      display_name: '',
      email_id: '',
      gender: '',
      account_type: '',
      phone_number: '',
      date_of_birth: '',
      role_name: '',
      role_hash: '',
      is_active: true,
      is_locked: false,
    },
  });

  useEffect(() => {
    if (open && user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        email_id: user.email_id || '',
        gender: user.gender || '',
        account_type: user.account_type || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        role_hash: user.roles?.[0] || '',
        role_name: user.role_names?.[0] || '',
        is_active: user.is_active ?? true,
        is_locked: user.is_locked ?? false,
      });
    } else {
      reset({
        first_name: '',
        last_name: '',
        display_name: '',
        email_id: '',
        gender: '',
        account_type: '',
        phone_number: '',
        date_of_birth: '',
        role_hash: '',
        role_name: '',
        is_active: true,
        is_locked: false,
      });
    }
  }, [open, user, reset]);

  const submitForm = async (data: FormUser) => {
    try {
      if (!user.user_hash) {
        toast.error('User hash is missing', {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 3000,
        });
        return;
      }

      const input: UsersUpdateInput = {
        userHash: user.user_hash,
        orgCohortHash,
        emailId: data.email_id,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        gender: data.gender || undefined,
        phoneNumber: data.phone_number || undefined,
        dateOfBirth: data.date_of_birth || undefined,
      };

      await executeMutation(input);

      onSave?.(data);
      onOpenChange(false);

      const successMsg = isAdmin
        ? 'User updated successfully'
        : 'Profile updated successfully';

      toast.success(successMsg, {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
        duration: 3000,
      });
    } catch (err: unknown) {
      if (handlePermissionError(err)) return;
      const error = err as ApolloError;
      let errorMessage = 'Something went wrong';

      if (error?.graphQLErrors?.[0]?.message) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message.replace('Failed to update user: ', '');
      }

      console.error('❌ Mutation failed:', errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update the user details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-2">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="First Name"
                      maxLength={30}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                {errors.first_name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.first_name.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Last Name"
                      maxLength={15}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                {errors.last_name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.last_name.message as string}
                  </p>
                )}
              </div>

              {isAdmin && (
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Email Id <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="email_id"
                    control={control}
                    rules={{
                      required: 'Email is required',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Email is invalid',
                      },
                    }}
                    render={({ field }) => (
                      <Input {...field} placeholder="Email" maxLength={30} />
                    )}
                  />
                  {errors.email_id && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.email_id.message as string}
                    </p>
                  )}
                </div>
              )}

              {(selectedRole === 'USER' || selectedRole === 'ADMIN') && (
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Gender <span className="text-red-500">*</span>
                  </Label>

                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ? field.value : ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.value &&
                            !['MALE', 'FEMALE', 'OTHER'].includes(
                              field.value
                            ) && (
                              <SelectItem key={field.value} value={field.value}>
                                {field.value}
                              </SelectItem>
                            )}
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {errors.gender && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.gender.message as string}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className="block text-sm font-medium mb-2">
                  Phone Number
                </Label>
                <Controller
                  name="phone_number"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Phone Number"
                      type="tel"
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                {errors.phone_number && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.phone_number.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="YYYY-MM-DD" type="date" />
                  )}
                />
                {errors.date_of_birth && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.date_of_birth.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account Details Section - Admin Only */}
          {isAdmin && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Account Details
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isAdmin && (
                  <div>
                    <Label className="block text-sm font-medium mb-2 w-full">
                      User Name <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="display_name"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="User Name" />
                      )}
                    />
                    {errors.display_name && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.display_name.message as string}
                      </p>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Account Type <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="account_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ? field.value : ''}
                          disabled
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.value &&
                              !['USER', 'ADMIN'].includes(field.value) && (
                                <SelectItem
                                  key={field.value}
                                  value={field.value}
                                >
                                  {field.value}
                                </SelectItem>
                              )}
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.account_type && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.account_type.message as string}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isMutationLoading}
              className="flex items-center gap-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isMutationLoading}
              className="flex items-center gap-4"
            >
              {isSubmitting || isMutationLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
