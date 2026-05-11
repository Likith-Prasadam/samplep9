import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '@/store/slices/auth-slice';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('selection_token');
    localStorage.removeItem('user_hash');
    localStorage.removeItem('token');

    // Clear login response and other session data
    localStorage.removeItem('loginResponse');
    localStorage.removeItem('user');
    localStorage.removeItem('categoryId');
    localStorage.removeItem('notifications_sse_owner');

    localStorage.removeItem('selected_role');
    localStorage.removeItem('selected_role_hash');
    localStorage.removeItem('auth_state');

    // Clear Redux auth state (user + roles + currentRoleCohortHash)
    dispatch(clearAuth());

    // Notify storage change
    window.dispatchEvent(new Event('storageChange'));

    onOpenChange(false);

    // Navigate to login
    navigate('/login', { replace: true });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign out"
      handleConfirm={handleLogout}
      className="sm:max-w-sm"
    />
  );
}
