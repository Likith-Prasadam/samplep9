import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// import { useIsRootAdmin } from '@/hooks/use-root-admin';

type UsersPrimaryButtonsProps = {
  canManage?: boolean;
};

export function UsersPrimaryButtons({ canManage }: UsersPrimaryButtonsProps) {
  const navigate = useNavigate();

  const handleAddUser = () => {
    if (!canManage) {
      toast.error('You must be an Admin to perform this operation.');
      return;
    }
    navigate('/users/add');
  };

  return (
    <div className="flex gap-2 mt-4">
      {canManage && (
        <Button size={'sm'} onClick={handleAddUser}>
          <Plus className="w-3.5 h-3.5" /> Add User
        </Button>
      )}
    </div>
  );
}
