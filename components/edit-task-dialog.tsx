"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Task } from "@/lib/firebase-service"
import { TaskForm } from "@/components/task-form"

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EditTaskDialog({ task, open, onOpenChange, onUpdate, onDelete }: EditTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task information below.</DialogDescription>
        </DialogHeader>
        <TaskForm 
          task={task} 
          onSuccess={() => onOpenChange(false)}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  )
} 