"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoreHorizontal, Clock, Eye, CheckSquare, ListTodo } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Task } from "@/lib/firebase-service"
import { EmptyState } from "@/components/ui/empty-state"
import { useTasks } from "@/lib/tasks-context"
import { useClients } from "@/lib/clients-context"

interface TaskListProps {
  clientId: string
}

export function TaskList({ clientId }: TaskListProps) {
  const { tasks, loading: tasksLoading, updateTask, deleteTask } = useTasks()
  const { clients, loading: clientsLoading } = useClients()
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null)

  const client = clients.find(c => c.id === clientId)
  const clientTasks = tasks.filter(task => task.clientId === clientId)

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

  const todoTasks = clientTasks.filter((task) => task.status === "todo")
  const inProgressTasks = clientTasks.filter((task) => task.status === "in-progress")
  const doneTasks = clientTasks.filter((task) => task.status === "done")

  if (tasksLoading || clientsLoading) {
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

  if (clientTasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title={`No tasks for ${client?.name || 'this client'}`}
        description="This client doesn't have any tasks yet. Add your first task to get started."
        actionLabel="Add Task"
        onClick={() => {
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
          {clientTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={() => setViewTask(task)}
              onEdit={() => setEditTask(task)}
              onDelete={() => setDeleteTaskState(task)}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />
          ))}
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
              description="There are no completed tasks for this client."
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

      {viewTask && (
        <TaskDetailDialog
          task={viewTask}
          open={!!viewTask}
          onOpenChange={(open) => !open && setViewTask(null)}
        />
      )}

      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          onUpdate={updateTask}
        />
      )}

      {deleteTaskState && (
        <DeleteTaskDialog
          task={deleteTaskState}
          open={!!deleteTaskState}
          onOpenChange={(open) => !open && setDeleteTaskState(null)}
          onDelete={() => deleteTask(deleteTaskState.id)}
        />
      )}
    </Tabs>
  )
}

interface TaskCardProps {
  task: Task
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
}

function TaskCard({ task, onView, onEdit, onDelete, getStatusColor, getStatusLabel }: TaskCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{task.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {getStatusLabel(task.status)}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            {task.estimatedDuration} min
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
