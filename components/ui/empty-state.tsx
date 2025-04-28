"use client"

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onClick,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed",
      "bg-muted/50 min-h-[300px] space-y-4",
      className
    )}>
      <div className="bg-background rounded-full p-3 w-12 h-12 flex items-center justify-center shadow-sm">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-md">{description}</p>
      </div>
      {(actionLabel && actionHref) && (
        <Button asChild variant="outline">
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      )}
      {(actionLabel && onClick) && (
        <Button variant="outline" onClick={onClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
} 