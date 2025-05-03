"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Clock, Calendar, Briefcase, DollarSign, Mail, Phone, Edit, Trash2, MoreHorizontal, Eye, CheckSquare } from "lucide-react"
import { Client, Task, getClientTasks, deleteTask, updateTask } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { CurrencyFormatter } from "@/components/currency-formatter"

interface ClientDetailDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: ClientDetailDialogProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null)
  const { toast } = useToast()
  
  // Load tasks for the client
  const loadTasks = async () => {
    if (open && client) {
      try {
        setLoading(true)
        const tasksData = await getClientTasks(client.id)
        setTasks(tasksData)
      } catch (error) {
        console.error("Error loading client tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks for this client",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
  }
  
  // Initial load of tasks when dialog opens
  useEffect(() => {
    loadTasks()
  }, [client, open])
  
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
  
  return (
    <Dialog open={open && !viewTask && !editTask && !deleteTaskState} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{client.name}</DialogTitle>
          <DialogDescription>Client details and tasks</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Client Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Hourly Rate: <CurrencyFormatter amount={client.hourlyRate} /></span>
                    </div>
                  )}
                  {client.monthlyWage && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>Monthly Wage: <CurrencyFormatter amount={client.monthlyWage} /></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>Active Tasks</span>
                    </div>
                    <span className="font-medium">{client.activeTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>Completed Tasks</span>
                    </div>
                    <span className="font-medium">{client.completedTasks}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <AddTaskDialog clientId={client.id}>
                  <Button id="add-task-button" variant="outline" className="w-full" onClick={() => setTimeout(loadTasks, 1000)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </AddTaskDialog>
              </CardFooter>
            </Card>
          </div>

          {/* Tasks Section */}
          <div>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="todo">To Do</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="done">Done</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="h-5 w-1/3 bg-muted rounded"></div>
                            <div className="h-8 w-8 bg-muted rounded-full"></div>
                          </div>
                          <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-muted-foreground">No tasks found</h3>
                    <p className="text-sm text-muted-foreground">This client doesn't have any tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
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
                )}
              </TabsContent>

              <TabsContent value="todo" className="mt-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="h-5 w-1/3 bg-muted rounded"></div>
                            <div className="h-8 w-8 bg-muted rounded-full"></div>
                          </div>
                          <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : todoTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-muted-foreground">No to-do tasks</h3>
                    <p className="text-sm text-muted-foreground">This client doesn't have any to-do tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todoTasks.map((task) => (
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
                )}
              </TabsContent>

              <TabsContent value="in-progress" className="mt-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="h-5 w-1/3 bg-muted rounded"></div>
                            <div className="h-8 w-8 bg-muted rounded-full"></div>
                          </div>
                          <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : inProgressTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-muted-foreground">No in-progress tasks</h3>
                    <p className="text-sm text-muted-foreground">This client doesn't have any in-progress tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inProgressTasks.map((task) => (
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
                )}
              </TabsContent>

              <TabsContent value="done" className="mt-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="h-5 w-1/3 bg-muted rounded"></div>
                            <div className="h-8 w-8 bg-muted rounded-full"></div>
                          </div>
                          <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : doneTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-muted-foreground">No completed tasks</h3>
                    <p className="text-sm text-muted-foreground">This client doesn't have any completed tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doneTasks.map((task) => (
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
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
      
      {/* Task Detail Dialog */}
      {viewTask && (
        <TaskDetailDialog
          task={viewTask}
          open={!!viewTask}
          onOpenChange={() => setViewTask(null)}
        />
      )}
      
      {/* Edit Task Dialog */}
      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={(open) => {
            if (!open) {
              setEditTask(null);
              // Reload tasks to reflect any changes
              loadTasks();
            }
          }}
          onUpdate={handleUpdateTask}
        />
      )}
      
      {/* Delete Task Dialog */}
      {deleteTaskState && (
        <DeleteTaskDialog
          task={deleteTaskState}
          open={!!deleteTaskState}
          onOpenChange={(open) => !open && setDeleteTaskState(null)}
          onDelete={() => handleDeleteTask(deleteTaskState)}
        />
      )}
    </Dialog>
  );
}

// Helper component for task cards
function TaskCard({ 
  task, 
  onView, 
  onEdit, 
  onDelete, 
  getStatusColor, 
  getStatusLabel 
}: { 
  task: Task; 
  onView: () => void; 
  onEdit: () => void; 
  onDelete: () => void; 
  getStatusColor: (status: string) => string; 
  getStatusLabel: (status: string) => string; 
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <Card className="hover:bg-accent/5 transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{task.title}</h3>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{task.estimatedDuration} min</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 