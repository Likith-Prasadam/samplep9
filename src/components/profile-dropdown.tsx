import useDialogState from '@/hooks/use-dialog-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutDialog } from '@/components/sign-out-dialog';
import { RoleSwitcher } from '@/components/role-switcher';
import { useUser } from '@/context/user-context';
import { getAvatarColorClass, getAvatarInitials } from '@/lib/avatar-display';
import { useMemo } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState();
  const { user } = useUser();

  const displayName = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
  }, [user]);

  const displayEmail = useMemo(() => {
    return user?.email || 'No email';
  }, [user]);

  const avatarInitials = useMemo(() => {
    return getAvatarInitials(displayName);
  }, [displayName]);

  const avatarBgClass = useMemo(
    () => getAvatarColorClass(displayName),
    [displayName]
  );

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="relative h-9 gap-1.5 rounded-full border border-transparent px-1.5 pr-2 text-left shadow-none hover:border-border hover:bg-muted/60 data-[state=open]:border-border data-[state=open]:bg-muted/50"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user?.avatar} alt={displayName} />
              <AvatarFallback
                className={`rounded-lg font-semibold text-white ${avatarBgClass}`}
              >
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown
              className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70 sm:block"
              aria-hidden
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 overflow-hidden rounded-xl border-border/80 p-0 shadow-lg"
          align="end"
          sideOffset={6}
          forceMount
        >
          <div className="border-b border-border/80 bg-muted/30 px-3 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar} alt={displayName} />
                <AvatarFallback
                  className={`rounded-lg font-semibold text-white ${avatarBgClass}`}
                >
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] leading-tight text-muted-foreground">
              Signed in as{' '}
              <span className="font-medium text-foreground/90">
                {displayName}
              </span>
            </p>
          </div>

          <RoleSwitcher />

          <DropdownMenuSeparator className="m-0 bg-border" />
          <div className="px-1.5 pb-2 pt-1">
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer rounded-md"
              onSelect={() => setOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  );
}
