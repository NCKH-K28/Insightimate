'use client';

import React from 'react';
import { MoreHorizontal, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ActionPermission<TResource extends string, TAction extends string> {
  resource: TResource;
  action: TAction;
  conditions?: Record<string, any>;
  reason?: string;
}

export interface ActionItem<TResource extends string = string, TAction extends string = string> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  shortcut?: string;
  onClick?: () => void | Promise<void>;
  items?: ActionItem<TResource, TAction>[];

  permission?: ActionPermission<TResource, TAction>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface ActionGroupItem<
  TResource extends string = string,
  TAction extends string = string,
> {
  id: string;
  label?: string;
  items: ActionItem<TResource, TAction>[];
  permission?: ActionPermission<TResource, TAction>;
}

interface ActionMenuProps<TResource extends string = string, TAction extends string = string> {
  items: (ActionItem<TResource, TAction> | ActionGroupItem<TResource, TAction>)[];
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  loading?: boolean;
  className?: string;

  // ✅ Generic permission checking function
  hasPermission?: (
    resource: TResource,
    action: TAction,
    conditions?: Record<string, any>,
  ) => boolean;
  showDisabledActions?: boolean;
}

export const ActionMenu = <TResource extends string = string, TAction extends string = string>({
  items,
  trigger,
  align = 'end',
  side = 'bottom',
  disabled = false,
  loading = false,
  className,
  hasPermission,
  showDisabledActions = true,
}: ActionMenuProps<TResource, TAction>) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const checkActionPermission = React.useCallback(
    (
      action: ActionItem<TResource, TAction>,
    ): {
      allowed: boolean;
      reason?: string;
    } => {
      if (!action.permission || !hasPermission) {
        return { allowed: true };
      }

      const allowed = hasPermission(
        action.permission.resource,
        action.permission.action,
        action.permission.conditions,
      );

      return {
        allowed,
        reason: allowed ? undefined : action.permission.reason || 'Insufficient permissions',
      };
    },
    [hasPermission],
  );

  const handleItemClick = React.useCallback(
    async (action: ActionItem<TResource, TAction>) => {
      const permissionCheck = checkActionPermission(action);

      if (!permissionCheck.allowed) {
        console.warn('Action blocked:', permissionCheck.reason);
        return;
      }

      if (action.disabled || action.loading) return;

      if (action.requiresConfirmation) {
        const confirmed = window.confirm(
          action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()}?`,
        );
        if (!confirmed) return;
      }

      try {
        await action.onClick?.();
        setIsOpen(false);
      } catch (error) {
        console.error('Action failed:', error);
      }
    },
    [checkActionPermission],
  );

  const renderActionItem = (action: ActionItem<TResource, TAction>) => {
    const permissionCheck = checkActionPermission(action);
    const isDisabled = action.disabled || action.loading || !permissionCheck.allowed;

    if (!permissionCheck.allowed && !showDisabledActions) {
      return null;
    }

    if (action.items) {
      return (
        <DropdownMenuSub key={action.id}>
          <DropdownMenuSubTrigger disabled={isDisabled}>
            <div className='flex items-center space-x-2 flex-1'>
              {!permissionCheck.allowed ? (
                <Lock className='h-4 w-4 text-muted-foreground' />
              ) : action.icon ? (
                <action.icon className='h-4 w-4' />
              ) : null}
              <span className={cn(!permissionCheck.allowed && 'text-muted-foreground')}>
                {action.label}
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {action.items.map(renderActionItem).filter(Boolean)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    const menuItem = (
      <DropdownMenuItem
        key={action.id}
        onClick={() => handleItemClick(action)}
        disabled={isDisabled}
        className={cn(
          'flex items-center justify-between',
          action.variant === 'destructive' &&
            permissionCheck.allowed &&
            'text-destructive focus:text-destructive',
          action.variant === 'secondary' && 'text-muted-foreground',
          !permissionCheck.allowed && 'text-muted-foreground cursor-not-allowed',
        )}
      >
        <div className='flex items-center space-x-2'>
          {action.loading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : !permissionCheck.allowed ? (
            <Lock className='h-4 w-4' />
          ) : (
            action.icon && <action.icon className='h-4 w-4' />
          )}
          <span>{action.label}</span>
        </div>
        {action.shortcut && permissionCheck.allowed && (
          <kbd className='text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
            {action.shortcut}
          </kbd>
        )}
      </DropdownMenuItem>
    );

    if (!permissionCheck.allowed && permissionCheck.reason) {
      return (
        <TooltipProvider key={action.id}>
          <Tooltip>
            <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
            <TooltipContent>
              <p>{permissionCheck.reason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return menuItem;
  };

  const renderItems = () => {
    return items
      .map((item, index) => {
        if ('items' in item) {
          if (item.permission && hasPermission) {
            const groupAllowed = hasPermission(
              item.permission.resource,
              item.permission.action,
              item.permission.conditions,
            );
            if (!groupAllowed && !showDisabledActions) {
              return null;
            }
          }

          const renderedItems = item.items?.map(renderActionItem).filter(Boolean) ?? [];

          if (renderedItems.length === 0) return null;

          return (
            <React.Fragment key={item.id}>
              {index > 0 && <DropdownMenuSeparator />}
              {item.label && <DropdownMenuLabel>{item.label}</DropdownMenuLabel>}
              {renderedItems}
            </React.Fragment>
          );
        } else {
          return renderActionItem(item);
        }
      })
      .filter(Boolean);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant='ghost'
            size='sm'
            disabled={disabled || loading}
            className={cn('h-8 w-8 p-0', className)}
          >
            {loading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <MoreHorizontal className='h-4 w-4' />
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className='w-56'>
        {renderItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
