"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Task } from "@/lib/firebase-service"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ScheduleTimeDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>
}

export function ScheduleTimeDialog({ task, open, onOpenChange, onUpdate }: ScheduleTimeDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    task.startDate ? new Date(task.startDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    task.endDate ? new Date(task.endDate) : undefined
  )
  const [startTime, setStartTime] = useState(task.startTime || "")
  const [endTime, setEndTime] = useState(task.endTime || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Reset states when dialog opens with new task
  useEffect(() => {
    if (open) {
      setStartDate(task.startDate ? new Date(task.startDate) : undefined)
      setEndDate(task.endDate ? new Date(task.endDate) : undefined)
      setStartTime(task.startTime || "")
      setEndTime(task.endTime || "")
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (startTime && !timeRegex.test(startTime)) {
      toast({
        title: "Invalid start time",
        description: "Please use the format HH:MM (e.g., 09:30)",
        variant: "destructive",
      })
      return
    }
    if (endTime && !timeRegex.test(endTime)) {
      toast({
        title: "Invalid end time",
        description: "Please use the format HH:MM (e.g., 17:30)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const updatedTask: Partial<Task> = {
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        startTime,
        endTime,
      }

      await onUpdate(task.id, updatedTask)
      toast({
        title: "Schedule updated",
        description: "Task schedule has been updated successfully.",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Task: {task.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Start Date & Time</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="mb-1.5 block">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="startTime" className="mb-1.5 block">Time</Label>
                    <div className="relative">
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full"
                      />
                      <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">End Date & Time</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="endDate" className="mb-1.5 block">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="mb-1.5 block">Time</Label>
                    <div className="relative">
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full"
                      />
                      <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate(undefined)
                  setStartTime("")
                }}
                disabled={!startDate && !startTime}
                className="flex-1"
              >
                Clear Start
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEndDate(undefined)
                  setEndTime("")
                }}
                disabled={!endDate && !endTime}
                className="flex-1"
              >
                Clear End
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 