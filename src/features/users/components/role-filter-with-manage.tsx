import * as React from 'react';
import { CheckIcon, PlusCircle, Pencil, Trash2, Plus } from 'lucide-react';
import { type Column } from '@tanstack/react-table';
import { useQuery } from '@apollo/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { GET_ROLES } from '@/graphql/roles_queries';
import { RoleFormDialog, type RoleRecord } from './role-form-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { RoleDeleteDialog } from './role-delete-dialog';
import { toast } from 'sonner';

type RoleFilterWithManageProps<TData, TValue> = {
  column?: Column<TData, TValue>;
  title?: string;
  onRolesChange?: () => void;
  isAdmin?: boolean;
  assignedRoleNames?: string[];
};

export function RoleFilterWithManage<TData, TValue>({
  column,
  title = 'Role',
  onRolesChange,
  isAdmin,
  assignedRoleNames,
}: RoleFilterWithManageProps<TData, TValue>) {
  const perms = usePermissions();
  const canManageRoles = perms.isRootAdmin || !!isAdmin;
  const [open, setOpen] = React.useState(false);
  const [addRoleOpen, setAddRoleOpen] = React.useState(false);
  const [editRole, setEditRole] = React.useState<RoleRecord | null>(null);
  const [deleteRole, setDeleteRole] = React.useState<RoleRecord | null>(null);

  const { data, loading, refetch } = useQuery(GET_ROLES, {
    variables: { page: 1, itemsPerPage: 100 },
    skip: !open,
  });

  const roles: RoleRecord[] = React.useMemo(
    () =>
      (data?.getRoles?.roles ?? data?.getRoles ?? []).filter(
        (r: RoleRecord) => r.roleName
      ),
    [data]
  );

  const filterValue = column?.getFilterValue?.();
  const selectedValues = React.useMemo(() => {
    if (!filterValue) return new Set<string>();
    if (Array.isArray(filterValue)) return new Set(filterValue as string[]);
    return new Set<string>();
  }, [filterValue]);

  const handleSelect = (roleName: string) => {
    if (!column) return;
    const next = new Set(selectedValues);
    if (next.has(roleName)) next.delete(roleName);
    else next.add(roleName);
    const arr = Array.from(next);
    column.setFilterValue?.(arr.length ? arr : undefined);
  };

  const handleClearFilter = () => {
    column?.setFilterValue?.(undefined);
  };

  const handleSuccess = () => {
    refetch();
    onRolesChange?.();
  };

  const assignedRoleNameSet = React.useMemo(
    () => new Set(assignedRoleNames ?? []),
    [assignedRoleNames]
  );

  if (!column) return null;

  const facets = column.getFacetedUniqueValues?.() ?? new Map();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <PlusCircle className="size-4" />
            {title}
            {selectedValues.size > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal lg:hidden"
                >
                  {selectedValues.size}
                </Badge>
                <div className="hidden space-x-1 lg:flex">
                  {selectedValues.size > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {selectedValues.size} selected
                    </Badge>
                  ) : (
                    roles
                      .filter((r) => selectedValues.has(r.roleName))
                      .map((r) => (
                        <Badge
                          variant="secondary"
                          key={r.roleHash}
                          className="rounded-sm px-1 font-normal"
                        >
                          {r.roleName}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <Spinner className="h-4 w-4 text-gray-200" />
                <p className="text-sm text-muted-foreground">
                  Wait for a while...
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] w-full">
                <CommandList>
                  <CommandEmpty>No roles found.</CommandEmpty>
                  <CommandGroup>
                    {roles.map((role) => {
                      const isSelected = selectedValues.has(role.roleName);
                      return (
                        <CommandItem
                          key={role.roleHash}
                          onSelect={() => handleSelect(role.roleName)}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={cn(
                              'border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <CheckIcon className="text-background h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate">
                            {role.roleName}
                          </span>
                          {facets.get(role.roleName) != null && (
                            <span className="text-muted-foreground font-mono text-xs">
                              {facets.get(role.roleName)}
                            </span>
                          )}
                          <div
                            className="flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canManageRoles && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setEditRole(role);
                                    setOpen(false);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (
                                      assignedRoleNameSet.has(role.roleName)
                                    ) {
                                      toast.error(
                                        'This role is assigned to one or more users. Remove it from Assign role'
                                      );
                                      return;
                                    }
                                    setDeleteRole(role);
                                    setOpen(false);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {selectedValues.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={handleClearFilter}
                          className="justify-center text-center"
                        >
                          Clear filters
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                  {canManageRoles && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setAddRoleOpen(true);
                            setOpen(false);
                          }}
                          className="justify-center border-t pt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Role
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      <RoleFormDialog
        open={addRoleOpen || !!editRole}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAddRoleOpen(false);
            setEditRole(null);
          }
        }}
        role={editRole}
        onSuccess={handleSuccess}
      />

      <RoleDeleteDialog
        open={!!deleteRole}
        onOpenChange={(isOpen) => !isOpen && setDeleteRole(null)}
        role={deleteRole}
        onSuccess={handleSuccess}
      />
    </>
  );
}
