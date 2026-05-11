import { useMutation, ApolloError } from '@apollo/client';
import { UPDATE_USER, SELF_UPDATE_USER } from '@/graphql/mutations';
import type { UsersUpdateInput } from '@/features/users/types';
import { usePermissions } from '@/hooks/use-permissions';
import {
  getUserProfileFromStorage,
  isUserAdmin,
  isEditingOwnProfile,
  getMutationType,
  logMutationSelection,
} from '@/features/users/utils/role-utils';

interface UseUserUpdateMutationResult {
  executeMutation: (input: UsersUpdateInput) => Promise<void>;
  isLoading: boolean;
  error: ApolloError | undefined;
  mutationType: 'updateUser' | 'selfUpdateUser';
  isAdmin: boolean;
  isEditingSelf: boolean;
}

interface UseUserUpdateMutationOptions {
  targetUserHash?: string;
  orgCohortHash?: string;
  onSuccess?: () => void;
  onError?: (error: ApolloError) => void;
}

export const useUserUpdateMutation = (
  options: UseUserUpdateMutationOptions = {}
): UseUserUpdateMutationResult => {
  const { targetUserHash, orgCohortHash, onSuccess, onError } = options;

  const profile = getUserProfileFromStorage();
  const perms = usePermissions();

  // Prefer RBAC permissions (normalized roles + cohort scoping); fallback to storage heuristics.
  const isAdmin =
    (orgCohortHash ? perms.canManageUsers(orgCohortHash) : false) ||
    perms.isRootAdmin ||
    isUserAdmin(profile);
  const isEditingSelf = isEditingOwnProfile(profile, targetUserHash);

  const mutationType = isAdmin ? 'updateUser' : getMutationType(profile);

  const [
    executeUpdateUser,
    { loading: updateUserLoading, error: updateUserError },
  ] = useMutation(UPDATE_USER);
  const [
    executeSelfUpdateUser,
    { loading: selfUpdateUserLoading, error: selfUpdateUserError },
  ] = useMutation(SELF_UPDATE_USER);

  const isLoading = updateUserLoading || selfUpdateUserLoading;
  const error = updateUserError || selfUpdateUserError;

  const executeMutation = async (input: UsersUpdateInput): Promise<void> => {
    try {
      logMutationSelection(mutationType, {
        isAdmin,
        isEditingSelf,
        userHash: profile?.user_hash,
        targetUserHash,
      });

      if (mutationType === 'updateUser') {
        await executeUpdateUser({ variables: { input } });
      } else {
        await executeSelfUpdateUser({ variables: { input } });
      }

      onSuccess?.();
    } catch (err) {
      const apolloError = err as ApolloError;

      onError?.(apolloError);
      throw err;
    }
  };

  return {
    executeMutation,
    isLoading,
    error,
    mutationType,
    isAdmin,
    isEditingSelf,
  };
};

export default useUserUpdateMutation;
