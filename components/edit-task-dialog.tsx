"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Task } from "@/lib/firebase-service"
import { Clock, CalendarClock } from "lucide-react"
import { ScheduleTimeDialog } from "@/components/schedule-time-dialog"

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<Task>) => Promise<void>;
}

export function EditTaskDialog({ task, open, onOpenChange, onUpdate }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">(task.status as "todo" | "in-progress" | "done")
  const [dueDate, setDueDate] = useState(task.dueDate.split("T")[0])
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration.toString())
  const [loading, setLoading] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const { toast } = useToast()

  // Format date for display
  const formatScheduledDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status as "todo" | "in-progress" | "done")
      setDueDate(task.dueDate.split("T")[0])
      setEstimatedDuration(task.estimatedDuration.toString())
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !dueDate || !estimatedDuration) return

    setLoading(true)
    try {
      const duration = parseInt(estimatedDuration)
      if (isNaN(duration)) {
        throw new Error("Duration must be a number")
      }

      const updatedTask: Partial<Task> = {
        title,
        description,
        status,
        dueDate: `${dueDate}T00:00:00.000Z`,
        estimatedDuration: duration,
      }

      if (onUpdate) {
        await onUpdate(task.id, updatedTask)
      } else {
        // Fallback if no onUpdate provided
        toast({
          title: "Task updated",
          description: "Task has been updated successfully."
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleUpdate = async (id: string, data: Partial<Task>) => {
    if (onUpdate) {
      try {
        await onUpdate(id, data)
        toast({
          title: "Schedule updated",
          description: "Task schedule has been updated successfully.",
        })
      } catch (error) {
        console.error("Error updating schedule:", error)
        toast({
          title: "Error",
          description: "Failed to update schedule. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task information below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={status} 
                  onValueChange={(value: "todo" | "in-progress" | "done") => setStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Schedule</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowScheduleDialog(true)}
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                    Edit Schedule
                  </Button>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Start:</span>
                    {task.startTime ? (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>
                          {task.startDate ? `${formatScheduledDate(task.startDate)} ` : ""}
                          {task.startTime}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not set</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">End:</span>
                    {task.endTime ? (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>
                          {task.endDate ? `${formatScheduledDate(task.endDate)} ` : ""}
                          {task.endTime}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not set</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showScheduleDialog && (
        <ScheduleTimeDialog
          task={task}
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          onUpdate={handleScheduleUpdate}
        />
      )}
    </>
  )
}
