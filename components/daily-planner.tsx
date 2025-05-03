"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  LockOpenIcon,
  Pencil,
  Plus,
  Trash,
  X
} from "lucide-react"
import { format, addDays, subDays } from "date-fns"
import { TaskSelector } from "@/components/task-selector"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Task, ScheduleItem, addScheduleItem, updateScheduleItem, deleteScheduleItem, getScheduleForDate } from "@/lib/firebase-service"
import { PopoverTrigger, PopoverContent, Popover } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Extend the Task type to include properties we need
interface ExtendedTask extends Task {
  clientName?: string;
}

// Extend the TaskSelector component props
interface TaskSelectorProps {
  onSelect: (task: ExtendedTask) => void;
  onCancel: () => void;
}

// Override the imported TaskSelector with our own type
const TaskSelectorWithProps = TaskSelector as React.FC<TaskSelectorProps>;

export function DailyPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const timeSlots = useMemo(() => generateTimeSlots(), [])

  // Load schedule for the selected date
  useEffect(() => {
    loadSchedule()
  }, [selectedDate])

  async function loadSchedule() {
    setIsLoading(true)
    try {
      // Ensure selectedDate is a proper Date object
      const date = new Date(selectedDate)
      const scheduleItems = await getScheduleForDate(date)
      setTasks(scheduleItems)
    } catch (error) {
      console.error("Error loading schedule:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function generateTimeSlots() {
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour}:00`)
      slots.push(`${hour}:30`)
    }
    return slots
  }

  function handlePrevDay() {
    setSelectedDate(subDays(selectedDate, 1))
  }

  function handleNextDay() {
    setSelectedDate(addDays(selectedDate, 1))
  }

  function handleSelectDate(date: Date | undefined) {
    if (date) {
      setSelectedDate(date)
    }
  }

  async function handleAddTask(task: ExtendedTask, timeSlot: string) {
    if (!task) return

    try {
      const scheduleItem: Omit<ScheduleItem, 'id' | 'createdAt'> = {
        taskId: task.id,
        title: task.title,
        client: task.clientName || "",
        clientId: task.clientId,
        duration: 30, // Default to 30 minutes
        timeSlot: timeSlot as unknown as number, // Type conversion needed
        locked: false,
        date: format(selectedDate, "yyyy-MM-dd"),
        userId: task.userId // Add the userId field
      }

      await addScheduleItem(scheduleItem)
      loadSchedule()
    } catch (error) {
      console.error("Error adding task to schedule:", error)
    }

    setShowTaskSelector(false)
  }

  async function handleLockToggle(taskId: string, locked: boolean) {
    try {
      await updateScheduleItem(taskId, { locked: !locked })
      loadSchedule()
    } catch (error) {
      console.error("Error toggling task lock:", error)
    }
  }

  async function handleUpdateDuration(taskId: string, duration: number) {
    try {
      await updateScheduleItem(taskId, { duration })
      loadSchedule()
    } catch (error) {
      console.error("Error updating task duration:", error)
    }
  }

  async function handleRemoveTask(taskId: string) {
    try {
      await deleteScheduleItem(taskId)
      loadSchedule()
    } catch (error) {
      console.error("Error removing task from schedule:", error)
    }
  }

  function getTaskForTimeSlot(timeSlot: string) {
    return tasks.find(t => String(t.timeSlot) === timeSlot)
      }

  function formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "EEEE, MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {timeSlots.map((slot, index) => (
            <Card key={index} className="p-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 text-sm text-muted-foreground bg-muted h-4 rounded"></div>
                <div className="flex-1 h-12 bg-muted rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {timeSlots.map((timeSlot, index) => {
            const task = getTaskForTimeSlot(timeSlot)
                  return (
              <Card
                key={index}
                className={cn(
                  "p-3",
                  task?.locked ? "border-primary/20 bg-primary/5" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 text-sm text-muted-foreground">
                    {timeSlot}
                  </div>
                  {task ? (
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {task.client?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{task.title}</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.client} · {formatDuration(task.duration)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingTaskId === task.id ? (
                          <>
                            <Input
                              type="number"
                              value={task.duration}
                              onChange={(e) => handleUpdateDuration(task.id, parseInt(e.target.value))}
                              className="w-20"
                              min={15}
                              step={15}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTaskId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTaskId(task.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleLockToggle(task.id, task.locked)}
                            >
                              {task.locked ? (
                                <LockIcon className="h-4 w-4" />
                              ) : (
                                <LockOpenIcon className="h-4 w-4" />
                              )}
                            </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                              onClick={() => handleRemoveTask(task.id)}
                        >
                              <Trash className="h-4 w-4" />
                        </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : showTaskSelector && editingTaskId === timeSlot ? (
                    <div className="flex-1">
                      <TaskSelectorWithProps
                        onSelect={(task) => handleAddTask(task, timeSlot)}
                        onCancel={() => {
                          setShowTaskSelector(false)
                          setEditingTaskId(null)
                        }}
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start"
                      onClick={() => {
                        setShowTaskSelector(true)
                        setEditingTaskId(timeSlot)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add task
                    </Button>
                  )}
            </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
