"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Clock, Calendar, Briefcase, DollarSign, Mail, Phone, Trash2, MoreHorizontal, Eye, CheckSquare, ArrowLeft, Edit, MapPin, FileText } from "lucide-react"
import { Client, Task, getClientTasks, deleteTask, updateTask } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { CurrencyFormatter } from "@/components/currency-formatter"
import { useClients } from "@/lib/clients-context"
import { Toaster } from "@/components/ui/toaster"
import { EditClientDialog } from "@/components/edit-client-dialog"

export default function ClientPage() {
  const params = useParams()
  const router = useRouter()
  const { clients, deleteClient, updateClient } = useClients()
  const [client, setClient] = useState<Client | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const clientData = clients.find(c => c.id === params.id)
    if (clientData) {
      setClient(clientData)
    }
  }, [clients, params.id])

  // Load tasks for the client
  const loadTasks = async () => {
    if (client) {
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
  
  // Initial load of tasks
  useEffect(() => {
    loadTasks()
  }, [client])

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

  const handleDeleteClient = async () => {
    if (!client) return
    try {
      await deleteClient(client.id)
      toast({
        title: "Success",
        description: `Client '${client.name}' has been deleted`,
      })
      router.push("/clients")
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client",
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

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    try {
      await updateClient(id, data)
      toast({
        title: "Success",
        description: "Client updated successfully",
      })
      setShowEditDialog(false)
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive"
      })
    }
  }

  if (!client) return <div>Client not found</div>
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{client.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Client Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Contact Information</h3>
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
                  {client.invoiceEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>Invoice Email: {client.invoiceEmail}</span>
                    </div>
                  )}
                </div>

                {client.address && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Address</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{client.address}</span>
                    </div>
                    {(client.zip || client.city) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground opacity-0" />
                        <span>{[client.zip, client.city].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {client.country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground opacity-0" />
                        <span>{client.country}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Business Information</h3>
                  {client.vat && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>VAT: {client.vat}</span>
                    </div>
                  )}
                  {client.currency && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Currency: {client.currency}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Financial Information</h3>
                  {client.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Hourly Rate: <CurrencyFormatter amount={client.hourlyRate} currency={client.currency} /></span>
                    </div>
                  )}
                  {client.monthlyWage && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>Monthly Wage: <CurrencyFormatter amount={client.monthlyWage} currency={client.currency} /></span>
                    </div>
                  )}
                </div>
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

      {/* Task Detail Dialog */}
      {viewTask && (
        <TaskDetailDialog
          task={viewTask}
          open={!!viewTask}
          onOpenChange={() => setViewTask(null)}
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

      {/* Edit Client Dialog */}
      {client && (
        <EditClientDialog
          client={client}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onUpdate={handleUpdateClient}
        />
      )}

      {/* Delete Client Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{client.name}"? This action cannot be undone and will also delete all associated tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Toaster component at the end */}
      <Toaster />
    </div>
  )
}

// Helper component for task cards
function TaskCard({ 
  task, 
  onView, 
  onDelete, 
  getStatusColor, 
  getStatusLabel 
}: { 
  task: Task; 
  onView: () => void; 
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