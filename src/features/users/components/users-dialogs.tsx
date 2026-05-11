import UserDeleteDialog from './user-delete-dialog';
import UserEditDialog from './user-edit-dialog';
// import { UsersInviteDialog } from './users-invite-dialog'
import { useUsers } from '@/providers/users-provider';
import { useAppSelector } from '@/store';

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers();
  const orgCohortHash =
    useAppSelector((s) => s.auth.currentRoleCohortHash) || '';
  return (
    <>
      {/* <UsersInviteDialog
        key='user-invite'
        open={open === 'invite'}
        onOpenChange={(isOpen) => isOpen ? setOpen('invite') : setOpen(null)}
      /> */}

      {currentRow && (
        <>
          <UserEditDialog
            key={`user-edit-${currentRow.user_id}`}
            open={open === 'edit'}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setOpen('edit');
              } else {
                setOpen(null);
                setCurrentRow(null);
              }
            }}
            user={currentRow}
            orgCohortHash={orgCohortHash}
          />

          <UserDeleteDialog
            key={`user-delete-${currentRow.user_hash}`}
            open={open === 'delete'}
            onClose={() => {
              setOpen(null);
              setCurrentRow(null);
            }}
            userHash={currentRow.user_hash}
            orgCohortHash={orgCohortHash}
            userName={
              `${currentRow.first_name} ${currentRow.last_name}`.trim() ||
              'Unknown'
            }
          />
        </>
      )}
    </>
  );
}
