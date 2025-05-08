"use client"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Edit, MoreHorizontal, Trash2, Clock, ChevronRight, ChevronDown, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { useSearchParams } from "next/navigation"
import { Client, Task, getClients, getTasks } from "@/lib/firebase-service"
import { useAuthContext } from "@/lib/auth-context"

interface TasksViewProps {
  filter: "all" | "todo" | "in-progress" | "done"
}

export function TasksView({ filter }: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const { user } = useAuthContext()

  const searchParams = useSearchParams()
  const sortBy = searchParams.get("sortBy") || "due-date"
  const sortDirection = searchParams.get("sortDirection") || "asc"
  const groupBy = searchParams.get("groupBy") || "client"
  const searchTerm = searchParams.get("search") || ""

  // Load tasks and clients
  useEffect(() => {
    async function loadData() {
      if (!user) return
      
      try {
        setLoading(true)
        const [tasksData, clientsData] = await Promise.all([
          getTasks(user.uid),
          getClients(user.uid)
        ])
        setTasks(tasksData)
        setClients(clientsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user])

  // Filter tasks based on the selected filter
  const filteredTasks = tasks.filter((task) => {
    // Apply status filter
    if (filter !== "all" && task.status !== filter) {
      return false
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return task.title.toLowerCase().includes(searchLower) || task.description.toLowerCase().includes(searchLower)
    }

    return true
  })

  // Sort tasks based on the selected sort criteria
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title)
        break
      case "due-date":
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      case "duration":
        comparison = a.estimatedDuration - b.estimatedDuration
        break
      case "client":
        const clientA = clients.find((c) => c.id === a.clientId)?.name || ""
        const clientB = clients.find((c) => c.id === b.clientId)?.name || ""
        comparison = clientA.localeCompare(clientB)
        break
      default:
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }

    return sortDirection === "desc" ? -comparison : comparison
  })

  // Group tasks based on the selected grouping
  const groupTasks = () => {
    if (groupBy === "none") {
      return { "All Tasks": sortedTasks }
    }

    return sortedTasks.reduce((groups: Record<string, typeof sortedTasks>, task) => {
      let groupKey = ""

      switch (groupBy) {
        case "client":
          const client = clients.find((c) => c.id === task.clientId)
          groupKey = client ? client.name : "No Client"
          break
        case "status":
          groupKey = task.status === "todo" ? "To Do" : task.status === "in-progress" ? "In Progress" : "Done"
          break
        case "due-date":
          const date = new Date(task.dueDate)
          const today = new Date()
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)

          if (date.toDateString() === today.toDateString()) {
            groupKey = "Today"
          } else if (date.toDateString() === tomorrow.toDateString()) {
            groupKey = "Tomorrow"
          } else if (date < today) {
            groupKey = "Overdue"
          } else {
            groupKey = date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
          }
          break
        default:
          groupKey = "All Tasks"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }

      groups[groupKey].push(task)
      return groups
    }, {})
  }

  const groupedTasks = useMemo(() => groupTasks(), [groupBy, sortedTasks, clients]);

  // Initialize all groups as open
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {}
    Object.keys(groupedTasks).forEach((group) => {
      initialOpenState[group] = true
    })
    setOpenGroups(initialOpenState)
  }, [groupBy])

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "in-progress":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-md p-4 animate-pulse">
            <div className="h-5 w-1/3 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-full bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No tasks found matching your criteria.</div>
      ) : (
        Object.entries(groupedTasks).map(([group, tasks]) => (
          <Collapsible
            key={group}
            open={openGroups[group]}
            onOpenChange={() => toggleGroup(group)}
            className="border rounded-md overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {openGroups[group] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <h3 className="font-medium">{group}</h3>
                  <Badge variant="outline">{tasks.length}</Badge>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y">
                {tasks.map((task) => {
                  const client = clients.find((c) => c.id === task.clientId)

                  return (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-muted/20 cursor-pointer"
                      onClick={() => setViewTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{task.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(task.status)}>
                                {getStatusLabel(task.status)}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setViewTask(task)
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditTask(task)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDeleteTask(task)
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                                <span>{task.estimatedDuration} min</span>
                              </div>
                            <div>Due: {formatDate(task.dueDate)}</div>
                            <div>
                              Time: {task.startTime && task.endTime 
                                ? `${task.startTime} - ${task.endTime}`
                                : task.startTime 
                                  ? `Start: ${task.startTime}` 
                                  : task.endTime
                                    ? `End: ${task.endTime}`
                                    : "Not scheduled"}
                            </div>
                            {client && <div>Client: {client.name}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))
      )}

      {viewTask && (
        <TaskDetailDialog 
          task={viewTask}
          open={!!viewTask} 
          onOpenChange={() => setViewTask(null)}
        />
      )}

      {editTask && (
        <AddTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
        />
      )}

      {deleteTask && (
        <DeleteTaskDialog
          task={deleteTask}
          open={!!deleteTask}
          onOpenChange={(open) => !open && setDeleteTask(null)}
        />
      )}
    </div>
  )
}
