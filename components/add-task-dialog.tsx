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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addTask } from "@/lib/firebase-service"

interface AddTaskDialogProps {
  children: React.ReactNode
  clientId: string
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

export function AddTaskDialog({ children, clientId }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState("todo")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [durationOpen, setDurationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const { toast } = useToast()

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
    const predefinedOption = durationOptions.find(option => option.value === estimatedDuration)
    if (predefinedOption) return predefinedOption.label
    
    const durationValue = parseInt(estimatedDuration, 10)
    if (!isNaN(durationValue)) {
      if (durationValue < 60) return `${durationValue} min`
      if (durationValue % 60 === 0) return `${durationValue / 60} hours`
      return `${durationValue} min`
    }
    
    return "Select duration"
  }, [estimatedDuration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !estimatedDuration || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Convert estimatedDuration to a number
      const duration = parseInt(estimatedDuration, 10)
      
      await addTask({
        clientId,
        title,
        description,
        estimatedDuration: duration,
        dueDate,
        status: status as 'todo' | 'in-progress' | 'done',
        startTime,
        endTime
      })
      
    toast({
      title: "Task added",
      description: `${title} has been added to tasks.`,
    })

    // Reset form and close dialog
    setTitle("")
    setDescription("")
    setEstimatedDuration("")
    setDueDate("")
    setStatus("todo")
      setStartTime("")
      setEndTime("")
    setOpen(false)
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Add a new task for this client. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estimatedDuration">Estimated Duration</Label>
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
                    <div className="flex border-b px-3 py-2">
                <Input
                        placeholder="Search duration..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    
                    <div className="max-h-[300px] overflow-auto p-1">
                      {/* Show custom options if search doesn't match predefined options */}
                      {filteredOptions.length === 0 && customOptions && (
                        <div className="py-2">
                          <p className="px-2 text-xs text-muted-foreground mb-1">Custom durations:</p>
                          <button
                            className="flex items-center w-full pl-2 pr-8 py-1.5 text-sm hover:bg-accent"
                            onClick={() => {
                              setEstimatedDuration(customOptions.minutes.value)
                              setDurationOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                estimatedDuration === customOptions.minutes.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customOptions.minutes.label}
                          </button>
                          <button
                            className="flex items-center w-full pl-2 pr-8 py-1.5 text-sm hover:bg-accent"
                            onClick={() => {
                              setEstimatedDuration(customOptions.hours.value)
                              setDurationOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                estimatedDuration === customOptions.hours.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customOptions.hours.label}
                          </button>
                        </div>
                      )}
                      
                      {/* Show predefined options */}
                      {filteredOptions.length > 0 && (
                        <div className="py-2">
                          {filteredOptions.map((option) => (
                            <button
                              key={option.value}
                              className="flex items-center w-full pl-2 pr-8 py-1.5 text-sm hover:bg-accent"
                              onClick={() => {
                                setEstimatedDuration(option.value)
                                setDurationOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  estimatedDuration === option.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Show "no results" message if nothing to display */}
                      {filteredOptions.length === 0 && !customOptions && (
                        <div className="py-6 text-center">
                          <p className="text-sm text-muted-foreground">No duration found.</p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
