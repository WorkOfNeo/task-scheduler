"use client"

import { useState, useCallback, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskTable } from "@/components/task-table"
import { TasksViewControls } from "@/components/tasks-view-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { TasksProvider, useTasks } from "@/lib/tasks-context"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/lib/auth-context"
import { addTemporaryDemoData } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { useClients } from "@/lib/clients-context"

// Add debug logging
const debug = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TasksPage Debug] ${message}`)
  }
}

function TasksPageContent() {
  debug('Component initializing')
  const [activeTab, setActiveTab] = useState("all")
  const [isTabChanging, setIsTabChanging] = useState(false)
  const [isAddingDemoData, setIsAddingDemoData] = useState(false)
  const [numberOfTasks, setNumberOfTasks] = useState(5)
  const { user } = useAuthContext()
  const { tasks } = useTasks()
  const { clients } = useClients()
  const { toast } = useToast()

  // Filter tasks based on active tab
  const filteredTasks = useMemo(() => {
    if (activeTab === "all") return tasks
    return tasks.filter(task => task.status === activeTab)
  }, [tasks, activeTab])

  // Debounced tab change handler
  const handleTabChange = useCallback((value: string) => {
    debug(`Tab changing to: ${value}`)
    setIsTabChanging(true)
    
    // Small delay to prevent rapid tab switches
    setTimeout(() => {
      setActiveTab(value)
      setIsTabChanging(false)
    }, 100)
  }, [])

  const handleAddDemoData = async () => {
    if (!user) return

    try {
      setIsAddingDemoData(true)
      await addTemporaryDemoData(user.uid, numberOfTasks)
      toast({
        title: "Success",
        description: "Demo data added successfully"
      })
    } catch (error) {
      console.error("Error adding demo data:", error)
      toast({
        title: "Error",
        description: "Failed to add demo data",
        variant: "destructive"
      })
    } finally {
      setIsAddingDemoData(false)
    }
  }

  debug(`Rendering with active tab: ${activeTab}`)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">View, sort, and group all your tasks</p>
        </div>
        <div className="flex items-center gap-4">
          {clients.length > 0 ? (
            <AddTaskDialog clientId={clients[0].id}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </AddTaskDialog>
          ) : (
            <Button disabled variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="taskCount">Number of tasks:</Label>
            <Input
              id="taskCount"
              type="number"
              min={1}
              max={25}
              value={numberOfTasks}
              onChange={(e) => setNumberOfTasks(Math.min(25, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20"
            />
          </div>
          <Button 
            onClick={handleAddDemoData} 
            disabled={isAddingDemoData}
            variant="outline"
          >
            {isAddingDemoData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Demo Data...
              </>
            ) : (
              "Add Demo Data"
            )}
          </Button>
        </div>
      </div>

      <TasksViewControls />

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>

        {isTabChanging ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        ) : (
          <TaskTable tasks={filteredTasks} />
        )}
      </Tabs>
    </div>
  )
}

export default function TasksPage() {
  return (
    <TasksProvider>
      <TasksPageContent />
    </TasksProvider>
  )
}
