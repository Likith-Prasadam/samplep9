import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, ApolloError, useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CREATE_USER, GET_ROLES } from '@/graphql/mutations';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { handlePermissionError } from '@/utils/handle-permission-error';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { usePermissions } from '@/hooks/use-permissions';

export interface Role {
  id?: number;
  role_name?: string;
  role_hash?: string;
  roleName?: string;
  roleHash?: string;
  description?: string;
  created_at?: string;
  parentRoleHash?: string;
}

export interface Cohort {
  id: number;
  org_cohort_hash: string;
  org_cohort_name: string;
  orgCohortHash?: string;
  orgCohortName?: string;
  model_id: number;
  cohort_model_params?: Record<string, unknown>;
  cohort_default_prompts?: Record<string, unknown>;
  events_to_detect?: string[];
  created_at: string;
  updated_at: string;
  is_root: boolean;
  is_general: boolean;
  isRoot?: boolean;
  isGeneral?: boolean;
}

export interface RoleCohortPair {
  roleHash: string;
  roleName?: string;
  cohortHash: string;
  cohortName?: string;
}

interface FormData {
  displayName: string;
  firstName: string;
  lastName: string;
  emailId: string;
  gender: string;
  accountType: string;
  password: string;
  confirmPassword: string;
  roleCohortPairs: RoleCohortPair[];
  dateOfBirth?: string;
  phoneNumber?: string;
  userLanguage?: string;
  registeredLocation?: string;
  expiresAt?: string;
}

const USER_FORM_STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the user',
  },
  {
    id: 'account',
    title: 'Account & Security',
    description: 'Set up credentials and account type',
  },
  {
    id: 'roles',
    title: 'Roles',
    description: 'Assign roles for this user',
  },
];

const UserAddPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleHash, setSelectedRoleHash] = useState('');
  const [roleCohortPairs, setRoleCohortPairs] = useState<RoleCohortPair[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Read the selected org from sessionStorage (set when navigating from Users page)
  const currentOrg = useMemo(() => {
    const saved = sessionStorage.getItem('selectedOrg');
    return saved
      ? (JSON.parse(saved) as { orgCohortHash: string; orgCohortName: string })
      : null;
  }, []);
  const currentOrgCohortHash = currentOrg?.orgCohortHash ?? '';
  const currentOrgCohortName = currentOrg?.orgCohortName ?? '';

  const { currentRoleCohortHash, availableRoles } = useSelector(
    (state: RootState) => state.auth
  );
  const currentRole = useMemo(
    () =>
      availableRoles.find((r) => r.hash === currentRoleCohortHash) ||
      availableRoles[0],
    [availableRoles, currentRoleCohortHash]
  );
  const isAdmin = useMemo(
    () =>
      (currentRole?.role ?? localStorage.getItem('selected_role') ?? '')
        .toString()
        .toUpperCase() === 'ADMIN',
    [currentRole]
  );
  const perms = usePermissions();

  useEffect(() => {
    if (!currentOrgCohortHash) return;
    if (perms.canCreateUser(currentOrgCohortHash)) return;
    toast.error("You don't have permission to create users for this cohort.");
    navigate(`/users?cohort=${currentOrgCohortHash}`, { replace: true });
  }, [currentOrgCohortHash, navigate, perms]);

  const assignableRoles = useMemo(() => {
    console.log('Computing assignableRoles from roles:', roles);

    const filteredRoles = roles.filter((r) => {
      const roleName = (r.roleName ?? r.role_name ?? '').trim();
      if (!roleName || roleName.length === 0) return false;
      const suspiciousPatterns = [
        /^[^\w\s-]/,
        /XSS_TEST/,
        /DROP\s+TABLE/i,
        /^\s+$/,
        /^[^a-zA-Z0-9_\- ]/,
      ];
      return !suspiciousPatterns.some((pat) => pat.test(roleName));
    });

    console.log('Final assignableRoles:', filteredRoles);
    return filteredRoles;
  }, [roles]);

  const schema = yup.object().shape({
    displayName: yup
      .string()
      .required('User Name is required')
      .test(
        'no-spaces',
        'User Name should not start or end with spaces',
        (v) => (v ? v === v.trim() : false)
      )
      .test(
        'not-only-numbers',
        'User Name must contain at least one letter (cannot be only numbers)',
        (value) => {
          if (!value) return false;
          return !/^\d+$/.test(value);
        }
      ),
    firstName: yup
      .string()
      .required('First name is required')
      .matches(/^[a-zA-Z]+$/, 'First name must contain only alphabets'),
    lastName: yup
      .string()
      .required('Last name is required')
      .matches(/^[a-zA-Z]+$/, 'Last name must contain only alphabets'),
    emailId: yup
      .string()
      .required('Email is required')
      .email('Please enter a valid email address')
      .matches(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address'
      ),
    gender: yup.string().required('Gender is required'),
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Must contain at least one number')
      .matches(
        /[@$!%*?&]/,
        'Must contain at least one special character (@$!%*?&)'
      ),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords do not match')
      .required('Confirm password is required'),
    accountType: yup.string().required('Account Type is required'),
    dateOfBirth: yup
      .string()
      .required('Date of Birth is required')
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
    roleCohortPairs: yup
      .array()
      .of(
        yup.object().shape({
          roleHash: yup.string().optional(),
          roleName: yup.string().optional(),
          cohortHash: yup.string().optional(),
          cohortName: yup.string().optional(),
        })
      )
      .default([]),
  });

  const {
    control,
    formState: { errors, isSubmitting },
    trigger,
    getValues,
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as unknown as any,
    defaultValues: {
      displayName: '',
      firstName: '',
      lastName: '',
      emailId: '',
      gender: '',
      password: '',
      confirmPassword: '',
      accountType: '',
      roleCohortPairs: [],
      dateOfBirth: '',
      phoneNumber: '',
      userLanguage: '',
      registeredLocation: '',
      expiresAt: '',
    },
  });

  // No refetchQueries needed here — the page navigates away to /users after creation,
  // and the users list re-fetches on mount with the selected org's orgCohortHash.
  const [createUser, { loading: isCreating }] = useMutation(CREATE_USER);

  const {
    data: rolesData,
    error: rolesError,
    loading: rolesLoading,
  } = useQuery(GET_ROLES, {
    variables: {
      page: 1,
      itemsPerPage: 100,
      sortBy: '',
      sortOrder: '',
      filters: {
        roleName: '',
        searchTerm: '',
      },
    },
  });

  useEffect(() => {
    if (rolesError) {
      console.error('Roles error:', rolesError);
      toast.error('Failed to load roles: ' + rolesError.message, {
        position: 'bottom-center',
        duration: 5000,
      });
    }

    console.log('Roles Data:', rolesData);
    const rolesList =
      rolesData?.getRoles?.roles ||
      rolesData?.roles?.fetch_data_by_filters_roles?.roles ||
      rolesData?.roles ||
      [];

    console.log('Roles List:', rolesList);
    console.log('Is Admin:', isAdmin, 'Is Root Admin:', perms.isRootAdmin);

    if (Array.isArray(rolesList) && rolesList.length > 0) {
      const mappedRoles = rolesList
        .filter((role: Role) => role.roleHash && role.roleHash.trim() !== '')
        .map((role: Role) => ({
          id: role.id || 0,
          role_name: role.roleName,
          role_hash: role.roleHash,
          roleName: role.roleName,
          roleHash: role.roleHash,
          description: role.description,
          parentRoleHash: role.parentRoleHash,
        }));

      console.log('Mapped Roles:', mappedRoles);
      setRoles(mappedRoles);
    } else {
      console.warn('No roles found in response');
      setRoles([]);
    }
  }, [rolesData, rolesError, isAdmin, perms.isRootAdmin]);

  const handleAddRoleCohortPair = () => {
    if (!selectedRoleHash) {
      toast.error('Please select a role', {
        position: 'bottom-center',
        duration: 3000,
      });
      return;
    }
    if (!currentOrgCohortHash) {
      toast.error(
        'No organization selected. Please go back and select an organization.',
        {
          position: 'bottom-center',
          duration: 3000,
        }
      );
      return;
    }
    const selectedRole = assignableRoles.find(
      (r) => r.roleHash === selectedRoleHash
    );
    const roleName = selectedRole?.roleName || selectedRole?.role_name || '';
    const isDuplicate = roleCohortPairs.some(
      (p) =>
        p.roleHash === selectedRoleHash && p.cohortHash === currentOrgCohortHash
    );
    if (isDuplicate) {
      toast.error('This role is already added for this organization', {
        position: 'bottom-center',
        duration: 3000,
      });
      return;
    }
    setRoleCohortPairs([
      ...roleCohortPairs,
      {
        roleHash: selectedRoleHash,
        roleName,
        cohortHash: currentOrgCohortHash,
        cohortName: currentOrgCohortName,
      },
    ]);
    setSelectedRoleHash('');
  };

  // NEW FUNCTION - Place it after handleRemoveRoleCohortPair
  const handleCreateUser = async () => {
    // Safety check
    if (roleCohortPairs.length === 0) {
      toast.error('Please assign at least one role-cohort pair', {
        position: 'bottom-center',
        duration: 3000,
      });
      return;
    }

    const isValid = await trigger();
    if (!isValid) return;

    const formValues = getValues();

    try {
      await createUser({
        variables: {
          input: {
            displayName: formValues.displayName,
            password: formValues.password,
            firstName: formValues.firstName,
            lastName: formValues.lastName,
            emailId: formValues.emailId,
            gender: formValues.gender,
            accountType: formValues.accountType,
            roleCohortPairs: roleCohortPairs.map((p) => ({
              roleHash: p.roleHash,
              cohortHash: p.cohortHash,
            })),
            username: formValues.displayName,
            dateOfBirth: formValues.dateOfBirth || undefined,
            phoneNumber: formValues.phoneNumber || undefined,
            userLanguage: formValues.userLanguage || undefined,
            registeredLocation: formValues.registeredLocation || undefined,
            expiresAt: formValues.expiresAt || undefined,
          },
        },
      });

      toast.success('User created successfully', {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
        duration: 3000,
      });

      navigate(`/users?cohort=${currentOrgCohortHash}`, {
        state: { fromUserAdd: true },
      });
    } catch (err: unknown) {
      if (handlePermissionError(err)) return;

      const error = err as ApolloError;
      const rawMessage =
        error?.graphQLErrors?.[0]?.message || error?.message || '';

      let errorMessage = 'Something went wrong';

      if (
        rawMessage.includes('duplicate key') &&
        rawMessage.includes('emailId')
      ) {
        const match = rawMessage.match(/Key \(emailId\)=\(([^)]+)\)/);
        errorMessage = `Email (${match ? match[1] : formValues.emailId}) is already registered.`;
      } else if (
        rawMessage.includes('duplicate key') &&
        (rawMessage.includes('username') || rawMessage.includes('displayName'))
      ) {
        const match = rawMessage.match(
          /Key \((?:username|displayName)\)=\(([^)]+)\)/
        );
        errorMessage = `User Name (${match ? match[1] : formValues.displayName}) is already taken.`;
      } else if (
        rawMessage.includes('At least one role-cohort pair is required')
      ) {
        errorMessage = 'Please assign at least one role-cohort pair.';
      } else if (
        rawMessage.includes('ADMIN can only create users with') ||
        rawMessage.includes('can only create users with')
      ) {
        errorMessage = perms.isRootAdmin
          ? rawMessage
          : 'As an ADMIN, you can only create new users with ADMIN or USER roles.';
      } else if (rawMessage) {
        errorMessage = rawMessage;
      }

      toast.error(errorMessage, {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
        duration: 4000,
      });
    }
  };

  const handleRemoveRoleCohortPair = (index: number) => {
    setRoleCohortPairs(roleCohortPairs.filter((_, i) => i !== index));
  };

  // Per-step field validation before advancing
  const validateCurrentStep = async (): Promise<boolean> => {
    if (currentStep === 0) {
      return await trigger([
        'firstName',
        'lastName',
        'emailId',
        'gender',
        'dateOfBirth',
      ]);
    }
    if (currentStep === 1) {
      return await trigger([
        'displayName',
        'accountType',
        'password',
        'confirmPassword',
      ]);
    }
    if (currentStep === 2) {
      if (roleCohortPairs.length === 0) {
        toast.error('Please add at least one role-cohort pair', {
          position: 'bottom-center',
          duration: 3000,
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    setIsNavigating(true);
    const valid = await validateCurrentStep();
    if (valid && currentStep < USER_FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
    setIsNavigating(false);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsNavigating(true);
      setCurrentStep(currentStep - 1);
      setIsNavigating(false);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === USER_FORM_STEPS.length - 1;
  const currentFormStep = USER_FORM_STEPS[currentStep];

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main
        fixed
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto h-full min-h-0 flex flex-col text-left">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() =>
              navigate(`/users?cohort=${currentOrgCohortHash}`, {
                state: { fromUserAdd: true },
              })
            }
            className="self-start mb-6 flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Button>

          {/* Two-column layout: sidebar + content (matches camera-add) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start md:items-stretch flex-1 min-h-0">
            {/* ── Left rail: step progress bar ── */}
            <aside className="pt-2 md:pt-0 md:col-span-1 md:sticky md:top-6 md:self-start">
              <div className="rounded-2xl border border-border bg-card/80 px-4 py-5 shadow-sm space-y-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Setup flow
                </p>
                <div className="mt-2 space-y-6">
                  {USER_FORM_STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isClickable = index <= currentStep;
                    return (
                      <div key={step.id} className="flex items-start gap-3">
                        {/* Step indicator circle + connector line */}
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => isClickable && setCurrentStep(index)}
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                              isCompleted
                                ? 'border-primary bg-primary text-primary-foreground'
                                : isCurrent
                                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                  : 'border-border bg-background text-muted-foreground',
                              isClickable &&
                                'hover:border-primary hover:text-primary'
                            )}
                            aria-current={isCurrent ? 'step' : undefined}
                          >
                            {isCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </button>
                          {index < USER_FORM_STEPS.length - 1 && (
                            <div className="mt-1 h-10 w-px bg-border/60" />
                          )}
                        </div>

                        {/* Step label */}
                        <button
                          type="button"
                          onClick={() => isClickable && setCurrentStep(index)}
                          className={cn(
                            'flex-1 text-left rounded-md px-2 py-1.5 transition-colors',
                            isCurrent
                              ? 'bg-muted'
                              : isCompleted
                                ? 'hover:bg-muted/70'
                                : 'hover:bg-muted/60'
                          )}
                        >
                          <div
                            className={cn(
                              'text-sm font-medium',
                              isCurrent || isCompleted
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {step.title}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ── Right column: card form content ── */}
            <section className="md:col-span-2 min-h-0 relative">
              <div className="spectra-scrollbar space-y-6 w-full h-full min-h-0 md:overflow-y-auto md:pr-2 md:pb-6">
                <form
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="space-y-6"
                >
                  <Card className="flex flex-col border border-border shadow-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="mt-1 text-xl">
                        {currentFormStep.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {currentFormStep.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* ══ STEP 0: Personal Information ══ */}
                      {currentStep === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          {/* First Name */}
                          <div className="space-y-2">
                            <label
                              htmlFor="firstName"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="firstName"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  id="firstName"
                                  placeholder="John"
                                  maxLength={256}
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value.replace(/[^a-zA-Z]/g, '')
                                    )
                                  }
                                />
                              )}
                            />
                            {errors.firstName && (
                              <p className="text-xs text-red-500">
                                {errors.firstName.message}
                              </p>
                            )}
                          </div>

                          {/* Last Name */}
                          <div className="space-y-2">
                            <label
                              htmlFor="lastName"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="lastName"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  id="lastName"
                                  placeholder="Doe"
                                  maxLength={15}
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value.replace(/[^a-zA-Z]/g, '')
                                    )
                                  }
                                />
                              )}
                            />
                            {errors.lastName && (
                              <p className="text-xs text-red-500">
                                {errors.lastName.message}
                              </p>
                            )}
                          </div>

                          {/* Email */}
                          <div className="space-y-2">
                            <label
                              htmlFor="emailId"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Email Address{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="emailId"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  id="emailId"
                                  type="email"
                                  placeholder="john@example.com"
                                  autoComplete="off"
                                  maxLength={256}
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                />
                              )}
                            />
                            {errors.emailId && (
                              <p className="text-xs text-red-500">
                                {errors.emailId.message}
                              </p>
                            )}
                          </div>

                          {/* Gender */}
                          <div className="space-y-2">
                            <label
                              htmlFor="gender"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="gender"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger
                                    id="gender"
                                    className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                  >
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MALE">Male</SelectItem>
                                    <SelectItem value="FEMALE">
                                      Female
                                    </SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {errors.gender && (
                              <p className="text-xs text-red-500">
                                {errors.gender.message}
                              </p>
                            )}
                          </div>

                          {/* Phone Number */}
                          <div className="space-y-2">
                            <label
                              htmlFor="phoneNumber"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Phone Number
                            </label>
                            <Controller
                              name="phoneNumber"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  id="phoneNumber"
                                  type="tel"
                                  placeholder="10-digit number"
                                  maxLength={10}
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        .replace(/[^0-9]/g, '')
                                        .slice(0, 10)
                                    )
                                  }
                                />
                              )}
                            />
                          </div>

                          {/* Date of Birth */}
                          <div className="space-y-2">
                            <label
                              htmlFor="dateOfBirth"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Date of Birth{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="dateOfBirth"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  id="dateOfBirth"
                                  type="date"
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                />
                              )}
                            />
                            {errors.dateOfBirth && (
                              <p className="text-xs text-red-500">
                                {errors.dateOfBirth.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ══ STEP 1: Account & Security ══ */}
                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          {/* User Name */}
                          <div className="space-y-2">
                            <label
                              htmlFor="displayName"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              User Name <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="displayName"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  id="displayName"
                                  placeholder="johndoe"
                                  autoComplete="off"
                                  maxLength={256}
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                />
                              )}
                            />
                            {errors.displayName && (
                              <p className="text-xs text-red-500">
                                {errors.displayName.message}
                              </p>
                            )}
                          </div>

                          {/* Account Type */}
                          <div className="space-y-2">
                            <label
                              htmlFor="accountType"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Account Type{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="accountType"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger
                                    id="accountType"
                                    className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                  >
                                    <SelectValue placeholder="Select account type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {errors.accountType && (
                              <p className="text-xs text-red-500">
                                {errors.accountType.message}
                              </p>
                            )}
                          </div>

                          {/* Password */}
                          <div className="space-y-2">
                            <label
                              htmlFor="password"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Password <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="password"
                              control={control}
                              render={({ field }) => (
                                <div className="relative">
                                  <Input
                                    {...field}
                                    id="password"
                                    maxLength={10}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    autoComplete="new-password"
                                    className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            />
                            {errors.password && (
                              <p className="text-xs text-red-500">
                                {errors.password.message}
                              </p>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-2">
                            <label
                              htmlFor="confirmPassword"
                              className="text-sm font-medium text-muted-foreground"
                            >
                              Confirm Password{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <Controller
                              name="confirmPassword"
                              control={control}
                              render={({ field }) => (
                                <div className="relative">
                                  <Input
                                    {...field}
                                    id="confirmPassword"
                                    type={
                                      showConfirmPassword ? 'text' : 'password'
                                    }
                                    placeholder="Confirm password"
                                    autoComplete="new-password"
                                    maxLength={10}
                                    className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            />
                            {errors.confirmPassword && (
                              <p className="text-xs text-red-500">
                                {errors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ══ STEP 2: Roles ══ */}
                      {currentStep === 2 && (
                        <div className="space-y-6">
                          {currentOrgCohortName && (
                            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                              Assigning roles to:{' '}
                              <span className="font-semibold">
                                {currentOrgCohortName}
                              </span>
                            </div>
                          )}
                          <div className="grid grid-cols-1 gap-y-5">
                            {/* Role selector */}
                            <div className="space-y-2">
                              <label
                                htmlFor="roleSelect"
                                className="text-sm font-medium text-muted-foreground"
                              >
                                Role <span className="text-red-500">*</span>
                                {rolesLoading && (
                                  <span className="text-xs ml-2">
                                    (Loading...)
                                  </span>
                                )}
                              </label>
                              <Select
                                value={selectedRoleHash}
                                onValueChange={setSelectedRoleHash}
                                disabled={rolesLoading}
                              >
                                <SelectTrigger
                                  id="roleSelect"
                                  className="h-10 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                >
                                  <SelectValue
                                    placeholder={
                                      rolesLoading
                                        ? 'Loading roles...'
                                        : 'Choose a role...'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {rolesLoading ? (
                                    <div className="p-2 text-sm text-muted-foreground">
                                      Loading roles...
                                    </div>
                                  ) : assignableRoles.length === 0 ? (
                                    <div className="p-2 text-sm text-red-500">
                                      No roles available.{' '}
                                      {isAdmin &&
                                        !perms.isRootAdmin &&
                                        '(ADMIN users can only assign ADMIN or USER roles)'}
                                    </div>
                                  ) : (
                                    assignableRoles
                                      .filter(
                                        (r) =>
                                          r.roleHash && r.roleHash.trim() !== ''
                                      )
                                      .map((role) => (
                                        <SelectItem
                                          key={role.roleHash!}
                                          value={role.roleHash!}
                                        >
                                          {role.roleName ?? role.role_name}
                                        </SelectItem>
                                      ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddRoleCohortPair}
                            className="w-full"
                          >
                            + Add Role-Cohort Pair
                          </Button>

                          {/* Assigned pairs list */}
                          {roleCohortPairs.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-foreground">
                                Assigned Pairs ({roleCohortPairs.length})
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {roleCohortPairs.map((pair, index) => (
                                  <div
                                    key={index}
                                    className="rounded-lg border bg-muted/40 p-3 flex items-start justify-between"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {pair.roleName}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {pair.cohortName}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveRoleCohortPair(index)
                                      }
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2 h-7 w-7 p-0"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed p-6 text-center bg-muted/20">
                              <p className="text-sm font-medium text-foreground">
                                No pairs added yet
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Select a role and cohort above, then click Add.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ══ Step Navigation (matches FormStepsCarousel) ══ */}
                      <div className="flex items-center justify-between pt-6 border-t mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          disabled={isFirstStep || isNavigating}
                          className="gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>

                        <div className="text-sm text-muted-foreground">
                          Step {currentStep + 1} of {USER_FORM_STEPS.length}
                        </div>

                        {isLastStep ? (
                          <Button
                            type="button"
                            onClick={handleCreateUser}
                            className="gap-2 bg-primary hover:opacity-90"
                            disabled={
                              isSubmitting ||
                              isCreating ||
                              roleCohortPairs.length === 0 ||
                              isNavigating
                            }
                          >
                            {isSubmitting || isCreating
                              ? 'Creating User...'
                              : 'Create User'}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleNext}
                            className="gap-2"
                            disabled={isNavigating}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            </section>
          </div>
        </div>
      </Main>
    </div>
  );
};

export default UserAddPage;
