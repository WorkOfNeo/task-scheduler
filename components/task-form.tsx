"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Task } from "@/lib/firebase-service"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useClients } from "@/lib/clients-context"
import { useTasks } from "@/lib/tasks-context"
import { Checkbox } from "@/components/ui/checkbox"
import { useSettings } from "@/lib/settings-context"
import { DatePicker } from '@/components/ui/date-picker'
import { getCurrentUserId } from "@/lib/firebase-service"

interface TaskFormProps {
  task?: Task;
  onSuccess?: () => void;
  onDelete?: () => Promise<void>;
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

export function TaskForm({ task, onSuccess, onDelete }: TaskFormProps) {
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
  const [selectedClientId, setSelectedClientId] = useState(task?.clientId || "")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">(task?.priority || "")
  const { toast } = useToast()
  const { clients } = useClients()
  const { tasks, updateTask, addTask } = useTasks()
  const [blockedBy, setBlockedBy] = useState<string[]>(task?.blockedBy || [])
  const { schedules } = useSettings()
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>(task?.schedules || [])
  const [hours, setHours] = useState(task?.estimatedDuration ? (task.estimatedDuration / 60).toString() : "")
  const [dueDateObj, setDueDateObj] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null)
  const [startDateObj, setStartDateObj] = useState<Date | null>(task?.startDate ? new Date(task.startDate) : null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    (t) => t.id !== task?.id && (!t.blockedBy || t.blockedBy.length === 0)
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
        userId: getCurrentUserId(),
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

      if (task) {
        // Update existing task
        await updateTask(task.id, taskData)
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

      onSuccess?.()
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

  const handleDelete = async () => {
    if (!onDelete) return
    
    try {
      setIsDeleting(true)
      await onDelete()
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger>
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
        </div>

        {/* Schedule Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <DatePicker
                selected={startDateObj}
                onChange={(date: Date | null) => {
                  setStartDateObj(date)
                  setStartDate(date?.toISOString().split('T')[0] || '')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <DatePicker
                selected={dueDateObj}
                onChange={(date: Date | null) => {
                  setDueDateObj(date)
                  setDueDate(date?.toISOString().split('T')[0] || '')
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration *</Label>
            <Popover open={durationOpen} onOpenChange={setDurationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={durationOpen}
                  className="w-full justify-between"
                >
                  {selectedDurationLabel}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <div className="p-2">
                  <Input
                    placeholder="Search or enter custom duration..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {filteredOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setHours(option.value)
                        setDurationOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          hours === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </Button>
                  ))}
                  {customOptions && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setHours(customOptions.minutes.value)
                          setDurationOpen(false)
                        }}
                      >
                        {customOptions.minutes.label}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setHours(customOptions.hours.value)
                          setDurationOpen(false)
                        }}
                      >
                        {customOptions.hours.label}
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Status and Priority</h3>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value: "todo" | "in-progress" | "done") => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(value: "low" | "medium" | "high" | "") => setPriority(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dependencies and Schedules */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dependencies and Schedules</h3>
          <div className="space-y-2">
            <Label>Blocked By</Label>
            <div className="space-y-2">
              {eligibleTasks.map((t) => (
                <div key={t.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`blocked-by-${t.id}`}
                    checked={blockedBy.includes(t.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBlockedBy([...blockedBy, t.id])
                      } else {
                        setBlockedBy(blockedBy.filter(id => id !== t.id))
                      }
                    }}
                  />
                  <Label htmlFor={`blocked-by-${t.id}`}>{t.title}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Available Schedules</Label>
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`schedule-${schedule.id}`}
                    checked={selectedScheduleIds.includes(schedule.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedScheduleIds([...selectedScheduleIds, schedule.id])
                      } else {
                        setSelectedScheduleIds(selectedScheduleIds.filter(id => id !== schedule.id))
                      }
                    }}
                  />
                  <Label htmlFor={`schedule-${schedule.id}`}>
                    {schedule.days.join(", ")} ({schedule.from} - {schedule.to})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
        </Button>
        {task && onDelete && (
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Task"}
          </Button>
        )}
      </div>
    </form>
  )
} 