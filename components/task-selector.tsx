"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Task, getIncompleteTasks } from "@/lib/firebase-service"

interface TaskSelectorProps {
  onSelect?: (task: Task) => void;
  onCancel?: () => void;
}

export function TaskSelector({ onSelect, onCancel }: TaskSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true)
        const tasksData = await getIncompleteTasks()
        setTasks(tasksData)
      } catch (error) {
        console.error("Error loading tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  // Filter tasks that are not done and match search term
  const availableTasks = tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const handleAddToSchedule = (task: Task) => {
    if (onSelect) {
      onSelect(task)
    } else {
      // Fallback if no onSelect handler is provided
    toast({
      title: "Task added to schedule",
        description: `${task.title} has been added to today's schedule.`,
    })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-md p-3 animate-pulse">
              <div className="h-5 w-full bg-muted rounded"></div>
              <div className="h-4 w-2/3 bg-muted rounded mt-2"></div>
              <div className="flex justify-between mt-2">
                <div className="h-3 w-16 bg-muted rounded"></div>
                <div className="h-3 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {onCancel && (
        <Button
          variant="outline"
          className="w-full text-sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {availableTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No available tasks found.</div>
        ) : (
          availableTasks.map((task) => (
            <div key={task.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{task.title}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 flex-shrink-0"
                  onClick={() => handleAddToSchedule(task)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground truncate">{task.description}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{task.estimatedDuration} min</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {task.status === "todo" ? "To Do" : "In Progress"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
