import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchUserProfile,
  updateUserProfile,
} from '@/store/slices/profile-slice';
import { profileFormSchema, type ProfileFormValues } from '../types/types';
import { useDebouncedQuery } from '@/hooks/use-debounced-query';
import { GET_USER_PROFILE } from '@/graphql/mutations';
import { Calendar } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const defaultValues: ProfileFormValues = {
  first_name: '',
  last_name: '',
  gender: '',
  user_language: '',
  date_of_birth: new Date(),
  email_id: '',
  registered_location: '',
  phone_number: '',
};

interface UserProfileResponse {
  users?: {
    fetch_data_by_filters_users?: {
      users?: Array<{
        user_id?: string;
        first_name?: string;
        last_name?: string;
        gender?: string;
        user_language?: string;
        date_of_birth?: string;
        email_id?: string;
        phone_number?: string;
        registered_location?: string;
      }>;
    };
  };
}

export const ProfileForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, loading, updateLoading } = useSelector(
    (state: RootState) => state.profile
  );

  const userData = useMemo(() => {
    const userDataString = localStorage.getItem('user');
    if (!userDataString) return null;
    try {
      return JSON.parse(userDataString);
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
      return null;
    }
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(profileFormSchema) as Resolver<ProfileFormValues>,
    defaultValues,
    mode: 'onChange',
  });

  const debouncedFetch = useDebouncedQuery<UserProfileResponse>({
    query: GET_USER_PROFILE,
    delay: 500,
    onCompleted: (data) => {
      const userData = data?.users?.fetch_data_by_filters_users?.users?.[0];
      if (userData) {
        reset({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          gender: userData.gender?.toLowerCase() || '',
          user_language: userData.user_language?.toLowerCase() || 'english',
          date_of_birth: userData.date_of_birth
            ? new Date(userData.date_of_birth)
            : null,
          email_id: userData.email_id || '',
          registered_location: userData.registered_location || '',
          phone_number: userData.phone_number || '',
        });
      }
    },
    onError: (error) => {
      console.error('Error fetching user data:', error);
      toast.error('Error fetching user data: ' + error.message, {
        position: 'bottom-center',
      });
    },
  });

  const handleRefresh = useCallback(() => {
    if (userData?.username) {
      debouncedFetch.execute({ username: userData.username });
    }
  }, [userData, debouncedFetch]);

  useEffect(() => {
    if (userData?.username) {
      dispatch(fetchUserProfile(userData.username));
    } else {
      toast.error('Authentication error. Please log in again.', {
        position: 'bottom-center',
      });
    }
  }, [userData, dispatch]);

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        gender: profile.gender?.toLowerCase() || '',
        user_language: profile.user_language?.toLowerCase() || 'english',
        date_of_birth: profile.date_of_birth
          ? new Date(profile.date_of_birth)
          : null,
        email_id: profile.email_id || '',
        registered_location: profile.registered_location || '',
        phone_number: profile.phone_number || '',
      });
    }
  }, [profile, reset]);

  const getInitials = useMemo(() => {
    if (!userData) return 'SA';
    const firstName = userData.first_name || '';
    const lastName = userData.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, [userData]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!profile?.user_id) {
      toast.error('User ID not found', {
        position: 'bottom-center',
      });
      return;
    }

    try {
      await dispatch(
        updateUserProfile({
          user_id: profile.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data?.gender || undefined,
          user_language: data.user_language,
          date_of_birth: data.date_of_birth || null,
          email_id: data.email_id,
          phone_number: data.phone_number || undefined,
          registered_location: data.registered_location || undefined,
        })
      ).unwrap();

      toast.success('Your profile has been updated successfully.', {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile',
        {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
        }
      );
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 ring-4 ring-primary/30 transition-all group-hover:ring-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                  {getInitials}
                </AvatarFallback>
              </Avatar>
              {/* <button
                type="button"
                className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 p-2 rounded-full shadow-lg transition-colors"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button> */}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold mb-1">Profile Information</h2>
              <p className="text-muted-foreground">
                This is how others will see you on the site.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleRefresh}
            disabled={debouncedFetch.loading || loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${debouncedFetch.loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>

        {loading && userData?.username ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <p className="ml-4 text-muted-foreground">
              Loading profile data...
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  First Name <span className="text-red-400">*</span>
                </Label>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter your first name" />
                  )}
                />
                {errors.first_name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-red-400">*</span>
                </Label>
                <Controller
                  name="last_name"
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter your last name" />
                  )}
                />
                {errors.last_name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex w-full gap-4">
              <div className="w-full flex-1">
                <Label className="block text-sm font-medium mb-2">Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <SelectTrigger className="w-full border">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.gender.message}
                  </p>
                )}
              </div>
              <div className="w-full flex-1">
                <Label className="block text-sm font-medium mb-2">
                  Language <span className="text-red-400">*</span>
                </Label>
                <Controller
                  name="user_language"
                  control={control}
                  rules={{ required: 'Language is required' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full border">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="telugu">Telugu</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.user_language && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.user_language.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  Date of Birth
                </Label>
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="start">
                        <Input
                          type="date"
                          value={
                            field.value ? format(field.value, 'yyyy-MM-dd') : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            field.onChange(date);
                          }}
                          max={format(new Date(), 'yyyy-MM-dd')}
                          min="1900-01-01"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.date_of_birth && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.date_of_birth.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-400">*</span>
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
                    <Input {...field} placeholder="example@email.com" />
                  )}
                />
                {errors.email_id && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.email_id.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  Location
                </Label>
                <Controller
                  name="registered_location"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Sydney, Australia"
                    />
                  )}
                />
                {errors.registered_location && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.registered_location.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  Phone Number
                </Label>
                <Controller
                  name="phone_number"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="tel"
                      value={field.value ?? ''}
                      placeholder="+40 735 631 620"
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                      onKeyDown={(e) => {
                        if (
                          !/^\d$/.test(e.key) &&
                          ![
                            'Backspace',
                            'Delete',
                            'Tab',
                            'ArrowLeft',
                            'ArrowRight',
                          ].includes(e.key) &&
                          !e.ctrlKey &&
                          !e.metaKey
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  )}
                />
                {errors.phone_number && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateLoading || loading || isSubmitting}
            >
              {updateLoading || isSubmitting ? (
                <div className="flex items-center gap-2">
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating profile...
                </div>
              ) : (
                'Update profile'
              )}
            </Button>
          </>
        )}
      </form>
    </div>
  );
};
