"use client"

import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { Task } from "@/lib/firebase-service"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/lib/tasks-context"
import { toast } from 'react-toastify'

interface OverdueTasksProps {
  tasks: Task[]
  loading: boolean
}

export function OverdueTasks({ tasks, loading }: OverdueTasksProps) {
  const { updateTask } = useTasks()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      case "in-progress":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      case "done":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleCompleteTask = async (task: Task) => {
    if (task.status === 'done') return
    const alreadyTracked = task.trackedHours || 0
    const expectedHours = task.estimatedDuration / 60
    const hoursToAdd = Math.max(expectedHours - alreadyTracked, 0)
    const newTracked = alreadyTracked + hoursToAdd
    try {
      await updateTask(task.id, {
        status: 'done',
        trackedHours: newTracked,
        completedAt: new Date().toISOString().split('T')[0],
      })
      toast.success(`Task "${task.title}" completed successfully!`)
    } catch (error) {
      console.error('Failed to complete task', error)
      toast.error('Failed to complete the task. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-md p-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-1/3 bg-muted rounded"></div>
              <div className="h-5 w-16 bg-muted rounded"></div>
            </div>
            <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
            <div className="flex items-center justify-between mt-3">
              <div className="h-3 w-16 bg-muted rounded"></div>
              <div className="h-3 w-16 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">No overdue tasks found.</div>
      ) :
        tasks.map((task) => (
          <div 
            key={task.id} 
            className={`border rounded-md p-3 hover:bg-muted/50 transition-colors ${
              task.status === 'done' ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between">
              <div className="font-medium break-words">{task.title}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
                {task.status !== 'done' && (
                  <Button size="sm" variant="outline" onClick={() => handleCompleteTask(task)}>
                    Complete
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between mt-2 text-xs text-muted-foreground">
              <div>Due: {formatDate(task.dueDate)}</div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{task.estimatedDuration} min</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1 break-words">
              <span className="font-medium">Time:</span> {task.startTime && task.endTime 
                ? `${task.startTime} - ${task.endTime}`
                : task.startTime 
                  ? `Start: ${task.startTime}` 
                  : task.endTime
                    ? `End: ${task.endTime}`
                    : "Not scheduled"}
            </div>
          </div>
        ))
      }
    </div>
  )
} 