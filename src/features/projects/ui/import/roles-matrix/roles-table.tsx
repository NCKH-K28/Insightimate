import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Role } from './types';

interface RolesTableProps {
  roles: Role[];
  basePermissions: string[];
  filteredPerms: string[];
  onEditRole: (role: Role) => void;
  onSetAllPerms: (roleId: string, enabled: boolean) => void;
  onDeleteRole: (roleId: string) => void;
  onTogglePermission: (roleId: string, perm: string) => void;
}

export function RolesTable({
  roles,
  basePermissions,
  filteredPerms,
  onEditRole,
  onSetAllPerms,
  onDeleteRole,
  onTogglePermission,
}: RolesTableProps) {
  return (
    <ScrollArea className='w-full'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[260px]'>Permission</TableHead>
            {roles.map((role) => (
              <TableHead key={role.id} className='align-top'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <div className='truncate font-medium'>{role.name}</div>
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {role.permissions.length} / {basePermissions.length}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                      <DropdownMenuLabel>Role</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEditRole(role)} className='gap-2'>
                        <Pencil className='h-4 w-4' /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSetAllPerms(role.id, true)}>
                        Grant all
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSetAllPerms(role.id, false)}>
                        Revoke all
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className='gap-2 text-destructive focus:text-destructive'
                          >
                            <Trash2 className='h-4 w-4' /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete role? </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Role{' '}
                              <span className='font-medium'>{role.name}</span> will be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              onClick={() => onDeleteRole(role.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPerms.map((perm) => (
            <TableRow key={perm}>
              <TableCell className='font-mono text-xs sm:text-sm'>{perm}</TableCell>
              {roles.map((role) => (
                <TableCell key={`${perm}: ${role.id}`} className='text-center'>
                  <div className='flex justify-start'>
                    <Checkbox
                      checked={role.permissions.includes(perm)}
                      onCheckedChange={() => onTogglePermission(role.id, perm)}
                      aria-label={`Toggle ${perm} for ${role.name}`}
                    />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
          {filteredPerms.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={1 + Math.max(roles.length, 1)}
                className='py-10 text-center text-sm text-muted-foreground'
              >
                No matching permissions.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  );
}
