"use client"

import { useState, useMemo } from "react"
import { DataTable, ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, AlarmClock, ChevronDown, ChevronUp, MoreHorizontal, Clock, CalendarClock, Loader2 } from "lucide-react"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { ScheduleTimeDialog } from "@/components/schedule-time-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Task, Client } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, isAfter, isBefore, isToday, isSameDay } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTasks } from "@/lib/tasks-context"
import { AddTaskDialog } from "@/components/add-task-dialog"

interface TaskTableProps {
  tasks: Task[]
}

export function TaskTable({ tasks = [] }: TaskTableProps) {
  const { loading, error, updateTask, deleteTask } = useTasks()
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null)
  const [scheduleTask, setScheduleTask] = useState<Task | null>(null)
  const { toast } = useToast()

  // Filter tasks based on the current filter
  const filteredTasks = useMemo(() => {
    return tasks || []
  }, [tasks])

  const columns: ColumnDef<Task>[] = [
    {
      id: "title",
      header: "Task",
      accessorFn: (row) => row.title,
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="flex items-center space-x-2">
            <span>{task.title}</span>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </div>
        )
      }
    },
    {
      id: "dueDate",
      header: "Due Date",
      accessorFn: (row) => row.dueDate,
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )
      }
    },
    {
      id: "duration",
      header: "Duration",
      accessorFn: (row) => row.estimatedDuration,
      cell: ({ row }) => {
        const task = row.original
        const hours = Math.floor(task.estimatedDuration / 60)
        const minutes = task.estimatedDuration % 60
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {hours > 0 ? `${hours}h ` : ''}
              {minutes > 0 ? `${minutes}m` : ''}
            </span>
          </div>
        )
      }
    }
  ]

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error loading tasks</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredTasks}
        onRowClick={(task) => setViewTask(task)}
      />

      {viewTask && (
        <TaskDetailDialog
          task={viewTask}
          open={!!viewTask}
          onOpenChange={(open) => !open && setViewTask(null)}
        />
      )}

      {editTask && (
        <AddTaskDialog
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

      {scheduleTask && (
        <ScheduleTimeDialog
          task={scheduleTask}
          open={!!scheduleTask}
          onOpenChange={(open) => !open && setScheduleTask(null)}
          onUpdate={updateTask}
        />
      )}
    </>
  )
} 