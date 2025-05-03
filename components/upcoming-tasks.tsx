"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { Task, getUpcomingTasks } from "@/lib/firebase-service"
import { useAuthContext } from "@/lib/auth-context"

export function UpcomingTasks() {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    async function loadUpcomingTasks() {
      if (!user) return

      try {
        setLoading(true)
        const tasks = await getUpcomingTasks(user.uid)
        setUpcomingTasks(tasks)
      } catch (error) {
        console.error("Error loading upcoming tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUpcomingTasks()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "in-progress":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
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
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
      {upcomingTasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">No upcoming tasks found.</div>
      ) : (
        upcomingTasks.map((task) => (
          <div key={task.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-medium">{task.title}</div>
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{task.estimatedDuration} min</span>
              </div>
              <div>Due: {formatDate(task.dueDate)}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
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
      )}
    </div>
  )
}
