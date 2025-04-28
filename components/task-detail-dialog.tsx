"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Clock, Calendar, User, FileText, CheckCircle, AlarmClock, CalendarClock } from "lucide-react"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { ScheduleTimeDialog } from "@/components/schedule-time-dialog"
import { Client, Task, getClient, updateTask } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch client data
  useEffect(() => {
    async function loadClient() {
      if (task && task.clientId) {
        try {
          setLoading(true)
          const clientData = await getClient(task.clientId)
          setClient(clientData)
        } catch (error) {
          console.error("Error loading client:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setClient(null)
        setLoading(false)
      }
    }

    if (open) {
      loadClient()
    }
  }, [task, task.clientId, open])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "border border-blue-200 bg-blue-50 text-blue-600"
      case "in-progress":
        return "border border-yellow-200 bg-yellow-50 text-yellow-600"
      case "done":
        return "border border-green-200 bg-green-50 text-green-600"
      default:
        return "border border-gray-200 bg-gray-50 text-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do"
      case "in-progress":
        return "In Progress"
      case "done":
        return "Done"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatScheduledDateTime = (date?: string, time?: string) => {
    if (!time) return "Not scheduled";
    
    let formattedDateTime = time;
    
    if (date) {
      const scheduleDate = new Date(date);
      const formattedDate = scheduleDate.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
      formattedDateTime = `${formattedDate} at ${time}`;
    }
    
    return formattedDateTime;
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }

    return `${mins}m`
  }

  const handleScheduleUpdate = async (id: string, data: Partial<Task>) => {
    try {
      await updateTask(id, data)
      toast({
        title: "Schedule updated",
        description: "Task schedule has been updated successfully.",
      })
      // We don't close the dialog here, as we want to keep viewing the task details
      setShowScheduleDialog(false)
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={open && !showEditDialog && !showScheduleDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <Badge className={`rounded-sm text-xs font-normal ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
            <DialogDescription>Task details and information</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                Description
              </div>
              <div className="rounded-md bg-muted p-4">{task.description || "No description provided."}</div>
            </div>

            {/* Client */}
            <div className="flex items-start gap-4">
              <div className="w-1/2">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <User className="mr-2 h-4 w-4" />
                  Client
                </div>
                <div className="font-medium">
                  {loading ? "Loading..." : client?.name || "No client assigned"}
                </div>
              </div>

              {/* Status */}
              <div className="w-1/2">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Status
                </div>
                <div className="font-medium">{getStatusLabel(task.status)}</div>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-start gap-4">
              <div className="w-1/2">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Calendar className="mr-2 h-4 w-4" />
                  Due Date
                </div>
                <div className="font-medium">{formatDate(task.dueDate)}</div>
              </div>

              {/* Duration */}
              <div className="w-1/2">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Clock className="mr-2 h-4 w-4" />
                  Estimated Duration
                </div>
                <div className="font-medium">{formatDuration(task.estimatedDuration)}</div>
              </div>
            </div>
            
            {/* Schedule Times */}
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Start:</div>
                  <div className="font-medium">
                    {formatScheduledDateTime(task.startDate, task.startTime)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">End:</div>
                  <div className="font-medium">
                    {formatScheduledDateTime(task.endDate, task.endTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setShowEditDialog(true)
              }}
            >
              <Edit className="h-4 w-4" />
              Edit Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <EditTaskDialog
          task={task}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) {
              onOpenChange(false)
            }
          }}
        />
      )}

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
