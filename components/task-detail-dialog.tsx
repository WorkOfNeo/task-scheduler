"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Clock, Calendar, User, FileText, CheckCircle, AlarmClock, CalendarClock, Save, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/rich-text-editor"
import { DatePicker } from '@/components/ui/date-picker'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronsUpDown } from "lucide-react"
import { Client, Task, getClient, updateTask } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { useClients } from "@/lib/clients-context"
import { useSettings } from "@/lib/settings-context"
import { useTasks } from "@/lib/tasks-context"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task: initialTask, open, onOpenChange }: TaskDetailDialogProps) {
  const [task, setTask] = useState<Task>(initialTask)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const { toast } = useToast()
  const { clients } = useClients()
  const { schedules } = useSettings()
  const { tasks, updateTask, deleteTask } = useTasks()
  const [durationInput, setDurationInput] = useState("")
  const [durationOpen, setDurationOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  // Update task state when initialTask changes
  useEffect(() => {
    setTask(initialTask)
  }, [initialTask])

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

  const handleFieldEdit = (field: string) => {
    setEditingField(field)
  }

  const handleFieldSave = async (field: string, value: any) => {
    try {
      setIsSubmitting(true)
      await updateTask(task.id, { [field]: value })
      setTask(prev => ({ ...prev, [field]: value }))
      setEditingField(null)
      toast({
        title: "Field updated",
        description: "The field has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating field:", error)
      toast({
        title: "Error",
        description: "Failed to update field. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldCancel = () => {
    setEditingField(null)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }

  const parseDuration = (input: string): number | null => {
    // Try to parse as "Xh Ym" format
    const hMatch = input.match(/(\d+)h\s*(\d+)?m?/)
    if (hMatch) {
      const hours = parseInt(hMatch[1])
      const minutes = hMatch[2] ? parseInt(hMatch[2]) : 0
      return hours * 60 + minutes
    }

    // Try to parse as just minutes
    const minutes = parseInt(input)
    if (!isNaN(minutes)) {
      return minutes
    }

    return null
  }

  const getDurationSuggestions = (input: string) => {
    const suggestions: { label: string; value: number; key: string }[] = []
    
    // If input is empty, show common durations
    if (!input) {
      return [
        { label: "30m", value: 30, key: "30m" },
        { label: "1h", value: 60, key: "1h" },
        { label: "1h 30m", value: 90, key: "1h30m" },
        { label: "2h", value: 120, key: "2h" },
        { label: "4h", value: 240, key: "4h" },
        { label: "8h", value: 480, key: "8h" }
      ]
    }

    // Try to parse the input
    const minutes = parseDuration(input)
    if (minutes !== null) {
      const formatted = formatDuration(minutes)
      suggestions.push({
        label: formatted,
        value: minutes,
        key: `parsed-${minutes}`
      })
    }

    // Add common durations that match the input
    const commonDurations = [30, 60, 90, 120, 180, 240, 360, 480]
    commonDurations.forEach(duration => {
      const formatted = formatDuration(duration)
      if (formatted.toLowerCase().includes(input.toLowerCase())) {
        suggestions.push({
          label: formatted,
          value: duration,
          key: `common-${duration}`
        })
      }
    })

    return suggestions
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const renderEditableField = (field: string, label: string, value: any, type: 'text' | 'select' | 'date' | 'rich-text' = 'text') => {
    const isEditing = editingField === field

    if (isEditing) {
      switch (type) {
        case 'select':
          return (
            <div className="flex items-center gap-2">
              <Select
                value={value}
                onValueChange={(newValue) => handleFieldSave(field, newValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field === 'status' ? (
                    <>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </>
                  ) : field === 'priority' ? (
                    <>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </>
                  ) : field === 'clientId' ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  ) : null}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={handleFieldCancel}>Cancel</Button>
            </div>
          )
        case 'date':
          return (
            <div className="flex items-center gap-2">
              <DatePicker
                selected={value ? new Date(value) : null}
                onChange={(date) => handleFieldSave(field, date?.toISOString().split('T')[0])}
                className="w-full"
              />
              <Button variant="ghost" size="sm" onClick={handleFieldCancel}>Cancel</Button>
            </div>
          )
        case 'rich-text':
          return (
            <div className="flex flex-col gap-2">
              <RichTextEditor
                content={value}
                onChange={(newValue) => handleFieldSave(field, newValue)}
              />
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleFieldCancel}>Cancel</Button>
              </div>
            </div>
          )
        default:
          if (field === 'estimatedDuration') {
            return (
              <div className="flex items-center gap-2">
                <Popover open={durationOpen} onOpenChange={setDurationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={durationOpen}
                      className="w-full justify-between"
                    >
                      {durationInput || formatDuration(value) || "Select duration..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Type duration (e.g., 1h 30m or 90)" 
                        value={durationInput}
                        onValueChange={setDurationInput}
                      />
                      <CommandEmpty>No duration found.</CommandEmpty>
                      <CommandGroup>
                        {getDurationSuggestions(durationInput).map((suggestion) => (
                          <CommandItem
                            key={suggestion.key}
                            value={suggestion.label}
                            onSelect={() => {
                              handleFieldSave(field, suggestion.value)
                              setDurationInput("")
                              setDurationOpen(false)
                            }}
                          >
                            {suggestion.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="sm" onClick={handleFieldCancel}>Cancel</Button>
              </div>
            )
          }
          return (
            <div className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => handleFieldSave(field, e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={handleFieldCancel}>Cancel</Button>
            </div>
          )
      }
    }

    // Display mode
    let displayValue = value
    if (field === 'clientId') {
      displayValue = clients.find(c => c.id === value)?.name || 'No client'
    } else if (field === 'estimatedDuration') {
      displayValue = formatDuration(value)
    } else if (field === 'dueDate' || field === 'startDate') {
      displayValue = formatDate(value)
    } else if (field === 'status') {
      return (
        <div 
          className="group relative cursor-pointer hover:bg-muted/20 p-2 rounded-md"
          onClick={() => handleFieldEdit(field)}
        >
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(value)} border`}>
              {getStatusLabel(value)}
            </Badge>
            <Edit className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )
    }

    return (
      <div 
        className="group relative cursor-pointer hover:bg-muted/20 p-2 rounded-md"
        onClick={() => handleFieldEdit(field)}
      >
        <div className="flex items-center justify-between">
          <span>{displayValue || `No ${label.toLowerCase()}`}</span>
          <Edit className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-[800px] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                {renderEditableField('title', 'Title', task.title)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={`rounded-sm text-xs font-normal ${getStatusColor(task.status)}`}>
                  {getStatusLabel(task.status)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogDescription>Task details and information</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto pr-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              {/* Left column */}
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Description</Label>
                  {renderEditableField('description', 'Description', task.description, 'rich-text')}
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
                  <Label className="text-xs uppercase text-muted-foreground">Client</Label>
                  {renderEditableField('clientId', 'Client', task.clientId, 'select')}
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Status</Label>
                  {renderEditableField('status', 'Status', task.status, 'select')}
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Priority</Label>
                  {renderEditableField('priority', 'Priority', task.priority, 'select')}
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Duration</Label>
                  {renderEditableField('estimatedDuration', 'Duration', task.estimatedDuration)}
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Due Date</Label>
                  {renderEditableField('dueDate', 'Due Date', task.dueDate, 'date')}
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Start Date</Label>
                  {renderEditableField('startDate', 'Start Date', task.startDate, 'date')}
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">Schedule</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Start:</div>
                      {renderEditableField('startTime', 'Start Time', task.startTime)}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">End:</div>
                      {renderEditableField('endTime', 'End Time', task.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showDeleteDialog && (
        <DeleteTaskDialog
          task={task}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDelete={async () => {
            await deleteTask(task.id)
            onOpenChange(false)
          }}
        />
      )}
    </>
  )
}
