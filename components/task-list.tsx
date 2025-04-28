"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoreHorizontal, Clock, Eye, CheckSquare, ListTodo } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Task, Client, getClientTasks, getClient, deleteTask, updateTask } from "@/lib/firebase-service"
import { EmptyState } from "@/components/ui/empty-state" 
import { useToast } from "@/components/ui/use-toast"

interface TaskListProps {
  clientId: string
}

export function TaskList({ clientId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [tasksData, clientData] = await Promise.all([
          getClientTasks(clientId),
          getClient(clientId)
        ])
        setTasks(tasksData)
        setClient(clientData)
      } catch (error) {
        console.error("Error loading tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId, toast])

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask(task.id)
      setTasks(tasks.filter((t) => t.id !== task.id))
      toast({
        title: "Success",
        description: `Task '${task.title}' has been deleted`,
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      })
    }
  }

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    try {
      await updateTask(id, data)
      setTasks(tasks.map((task) => 
        task.id === id ? { ...task, ...data } : task
      ))
      toast({
        title: "Success",
        description: "Task updated successfully",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      })
    }
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

  const todoTasks = tasks.filter((task) => task.status === "todo")
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress")
  const doneTasks = tasks.filter((task) => task.status === "done")

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-1/3 bg-muted rounded"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
              </div>
              <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="h-4 w-1/4 bg-muted rounded"></div>
                <div className="h-4 w-1/4 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title={`No tasks for ${client?.name || 'this client'}`}
        description="This client doesn't have any tasks yet. Add your first task to get started."
        actionLabel="Add Task"
        onClick={() => {
          // This will be handled by the AddTaskDialog in the parent component
          document.getElementById('add-task-button')?.click()
        }}
      />
    )
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="todo">To Do</TabsTrigger>
        <TabsTrigger value="in-progress">In Progress</TabsTrigger>
        <TabsTrigger value="done">Done</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks found"
              description="There are no tasks for this client yet."
              actionLabel="Add Task"
              onClick={() => document.getElementById('add-task-button')?.click()}
            />
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={() => setViewTask(task)}
                onEdit={() => setEditTask(task)}
                onDelete={() => setDeleteTaskState(task)}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="todo" className="mt-4">
        <div className="grid gap-4">
          {todoTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No to-do tasks"
              description="There are no tasks in the to-do status for this client."
              actionLabel="Add Task"
              onClick={() => document.getElementById('add-task-button')?.click()}
            />
          ) : (
            todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={() => setViewTask(task)}
                onEdit={() => setEditTask(task)}
                onDelete={() => setDeleteTaskState(task)}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="in-progress" className="mt-4">
        <div className="grid gap-4">
          {inProgressTasks.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No in-progress tasks"
              description="There are no tasks in progress for this client."
              actionLabel="Add Task"
              onClick={() => document.getElementById('add-task-button')?.click()}
            />
          ) : (
            inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={() => setViewTask(task)}
                onEdit={() => setEditTask(task)}
                onDelete={() => setDeleteTaskState(task)}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="done" className="mt-4">
        <div className="grid gap-4">
          {doneTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No completed tasks"
              description="There are no completed tasks for this client yet."
              actionLabel="Add Task"
              onClick={() => document.getElementById('add-task-button')?.click()}
            />
          ) : (
            doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={() => setViewTask(task)}
                onEdit={() => setEditTask(task)}
                onDelete={() => setDeleteTaskState(task)}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))
          )}
        </div>
      </TabsContent>

      {viewTask && <TaskDetailDialog task={viewTask} open={!!viewTask} onOpenChange={() => setViewTask(null)} />}

      {editTask && (
        <EditTaskDialog 
          task={editTask} 
          open={!!editTask} 
          onOpenChange={() => setEditTask(null)} 
          onUpdate={handleUpdateTask}
        />
      )}

      {deleteTaskState && (
        <DeleteTaskDialog 
          task={deleteTaskState} 
          open={!!deleteTaskState} 
          onOpenChange={() => setDeleteTaskState(null)} 
          onDelete={() => handleDeleteTask(deleteTaskState)}
        />
      )}
    </Tabs>
  )
}

interface TaskCardProps {
  task: Task;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

function TaskCard({ task, onView, onEdit, onDelete, getStatusColor, getStatusLabel }: TaskCardProps) {
  const dueDate = new Date(task.dueDate).toLocaleDateString()

  return (
    <Card className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={onView}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onView()
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between">
          <CardDescription>{task.description}</CardDescription>
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {getStatusLabel(task.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
            <span>{task.estimatedDuration} min</span>
          </div>
          <div className="text-muted-foreground">Due: {dueDate}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Time:</span> {task.startTime && task.endTime 
              ? `${task.startTime} - ${task.endTime}`
              : task.startTime 
                ? `Start: ${task.startTime}` 
                : task.endTime
                  ? `End: ${task.endTime}`
                  : "Not scheduled"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
