"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addTask, Task } from "@/lib/firebase-service"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useClients } from "@/lib/clients-context"
import { useTasks } from "@/lib/tasks-context"
import { Checkbox } from "@/components/ui/checkbox"
import { useSettings } from "@/lib/settings-context"
import { DatePicker } from '@/components/ui/date-picker'

interface AddTaskDialogProps {
  children?: React.ReactNode
  clientId?: string
  task?: Task
  onUpdate?: (id: string, data: Partial<Task>) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const durationOptions = [
  { label: "Reminder", value: "0" },
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "45 min", value: "45" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
  { label: "4 hours", value: "240" },
  { label: "8 hours", value: "480" },
  { label: "16 hours", value: "960" },
]

export function AddTaskDialog({ children, clientId: initialClientId, task, onUpdate, open: controlledOpen, onOpenChange }: AddTaskDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [dueDate, setDueDate] = useState(task?.dueDate?.split("T")[0] || "")
  const [startDate, setStartDate] = useState(task?.startDate?.split("T")[0] || "")
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">(task?.status || "todo")
  const [startTime, setStartTime] = useState(task?.startTime || "")
  const [endTime, setEndTime] = useState(task?.endTime || "")
  const [durationOpen, setDurationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [selectedClientId, setSelectedClientId] = useState(task?.clientId || initialClientId || "")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">(task?.priority || "")
  const { toast } = useToast()
  const { clients } = useClients()
  const { tasks } = useTasks()
  const [blockedBy, setBlockedBy] = useState<string[]>(task?.blockedBy || [])
  const { schedules } = useSettings()
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>(task?.schedules || [])
  const [hours, setHours] = useState(task?.estimatedDuration ? (task.estimatedDuration / 60).toString() : "")
  const [dueDateObj, setDueDateObj] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null)
  const [startDateObj, setStartDateObj] = useState<Date | null>(task?.startDate ? new Date(task.startDate) : null)

  // Memoize filtered options to prevent recalculation on every render
  const filteredOptions = useMemo(() => 
    searchInput
      ? durationOptions.filter(option => 
          option.label.toLowerCase().includes(searchInput.toLowerCase())
        )
      : durationOptions,
    [searchInput]
  )

  // Memoize custom options calculation
  const customOptions = useMemo(() => {
    const numericValue = parseInt(searchInput, 10)
    if (isNaN(numericValue) || numericValue <= 0) return null
    
    return {
      minutes: {
        label: `${numericValue} min`,
        value: numericValue.toString()
      },
      hours: {
        label: `${numericValue} hours`,
        value: (numericValue * 60).toString()
      }
    }
  }, [searchInput])

  // Get display label for the selected duration
  const selectedDurationLabel = useMemo(() => {
    const predefinedOption = durationOptions.find(option => option.value === hours)
    if (predefinedOption) return predefinedOption.label
    
    const durationValue = parseInt(hours, 10)
    if (!isNaN(durationValue)) {
      if (durationValue < 60) return `${durationValue} min`
      if (durationValue % 60 === 0) return `${durationValue / 60} hours`
      return `${durationValue} min`
    }
    
    return "Select duration"
  }, [hours])

  // Filter eligible tasks: not this task, not already blocked by something
  const eligibleTasks = tasks.filter(
    (t) => t.id !== undefined && (!t.blockedBy || t.blockedBy.length === 0)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !hours || !dueDate || !selectedClientId || !startDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Convert hours to a number
      const duration = Math.round(parseFloat(hours) * 60)
      
      const taskData = {
        clientId: selectedClientId,
        title,
        description,
        estimatedDuration: duration,
        dueDate,
        startDate,
        status: status as 'todo' | 'in-progress' | 'done',
        startTime,
        endTime,
        blockedBy,
        schedules: selectedScheduleIds,
        priority: priority || undefined
      } as const

      if (task && onUpdate) {
        // Update existing task
        await onUpdate(task.id, taskData)
        toast({
          title: "Task updated",
          description: `${title} has been updated successfully.`,
        })
      } else {
        // Add new task
        await addTask(taskData)
        toast({
          title: "Task added",
          description: `${title} has been added to tasks.`,
        })
      }

      // Reset form and close dialog
      setTitle("")
      setDescription("")
      setHours("")
      setDueDate("")
      setStartDate("")
      setStatus("todo")
      setStartTime("")
      setEndTime("")
      setSelectedClientId(initialClientId || "")
      setPriority("")
      setBlockedBy([])
      setSelectedScheduleIds([])
      setOpen(false)
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-[800px] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>{task ? "Update the task information below." : "Add a new task. Click save when you're done."}</DialogDescription>
        </DialogHeader>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="font-semibold">Task</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-xs">Mark complete</Button>
            <Button variant="destructive" className="text-xs">Resolve</Button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs uppercase text-muted-foreground">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="min-h-[200px] border rounded-md [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:ring-0 [&_.ProseMirror]:focus:ring-offset-0">
                  <RichTextEditor
                    content={description}
                    onChange={setDescription}
                  />
                </div>
              </div>
              {/* Attachments placeholder */}
              <div className="border rounded-md bg-muted/30">
                <button type="button" className="w-full text-left px-4 py-2 text-xs uppercase text-muted-foreground">Attachments (0)</button>
              </div>
              {/* Activity/comments placeholder */}
              <div className="border rounded-md bg-muted/30">
                <button type="button" className="w-full text-left px-4 py-2 text-xs uppercase text-muted-foreground">Activity</button>
                <div className="px-4 pb-2 pt-1">
                  <Input placeholder="Enter comment" className="text-sm" />
                </div>
              </div>
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="client" className="text-xs uppercase text-muted-foreground">Client *</Label>
                <Select 
                  value={selectedClientId} 
                  onValueChange={setSelectedClientId}
                  required
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-xs uppercase text-muted-foreground">Status</Label>
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
                <Label htmlFor="priority" className="text-xs uppercase text-muted-foreground">Priority</Label>
                <Select 
                  value={priority} 
                  onValueChange={(value: "low" | "medium" | "high" | "") => setPriority(value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hours" className="text-xs uppercase text-muted-foreground">Hours / Duration</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  step="0.25"
                  placeholder="Enter hours"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="text-xs uppercase text-muted-foreground">Due Date *</Label>
                <DatePicker
                  id="dueDate"
                  selected={dueDateObj}
                  onChange={date => {
                    setDueDateObj(date)
                    setDueDate(date ? date.toISOString().split('T')[0] : '')
                  }}
                  required
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate" className="text-xs uppercase text-muted-foreground">Start Date *</Label>
                <DatePicker
                  id="startDate"
                  selected={startDateObj}
                  onChange={date => {
                    setStartDateObj(date)
                    setStartDate(date ? date.toISOString().split('T')[0] : '')
                  }}
                  required
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="labels" className="text-xs uppercase text-muted-foreground">Labels</Label>
                <Input id="labels" placeholder="Add label(s)" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Add custom field</Label>
                <Button variant="outline" type="button" className="w-full">+ Add custom field</Button>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Blocked By</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {blockedBy.length === 0
                        ? "Select tasks"
                        : `${blockedBy.length} task${blockedBy.length > 1 ? "s" : ""} selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 max-h-60 overflow-auto">
                    {eligibleTasks.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No eligible tasks</div>
                    ) : (
                      eligibleTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            id={`blockedBy-${task.id}`}
                            checked={blockedBy.includes(task.id)}
                            onCheckedChange={(checked) => {
                              setBlockedBy((prev) =>
                                checked
                                  ? [...prev, task.id]
                                  : prev.filter((id) => id !== task.id)
                              )
                            }}
                          />
                          <Label htmlFor={`blockedBy-${task.id}`} className="text-xs text-muted-foreground cursor-pointer">
                            {task.title}
                          </Label>
                        </div>
                      ))
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Schedules</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedScheduleIds.length === 0
                        ? "Select schedules"
                        : `${selectedScheduleIds.length} selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 max-h-60 overflow-auto">
                    {schedules.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No schedules available</div>
                    ) : (
                      schedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            id={`schedule-${schedule.id}`}
                            checked={selectedScheduleIds.includes(schedule.id)}
                            onCheckedChange={(checked) => {
                              setSelectedScheduleIds((prev) =>
                                checked
                                  ? [...prev, schedule.id]
                                  : prev.filter((id) => id !== schedule.id)
                              )
                            }}
                          />
                          <Label htmlFor={`schedule-${schedule.id}`} className="text-xs text-muted-foreground cursor-pointer">
                            {schedule.days.join(", ")} {schedule.from}–{schedule.to}
                          </Label>
                        </div>
                      ))
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Blocking</Label>
                <Input placeholder="None" disabled />
              </div>
            </div>
          </div>
        </form>
        <DialogFooter className="flex-shrink-0 mt-6">
          <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Saving..." : task ? "Save Changes" : "Save Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
