"use client"

import { useState, useEffect, useMemo } from "react"
import { DataTable, ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, AlarmClock, ChevronDown, ChevronUp, MoreHorizontal, Clock, CalendarClock, Loader2 } from "lucide-react"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { ScheduleTimeDialog } from "@/components/schedule-time-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Task, Client, getTasks, getClients, deleteTask, updateTask } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, isAfter, isBefore, isToday, isSameDay } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TaskTableProps {
  filter: "all" | "todo" | "in-progress" | "done"
}

export function TaskTable({ filter }: TaskTableProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [scheduleTask, setScheduleTask] = useState<Task | null>(null)
  const { toast } = useToast()

  // Track which sections have expanded to show all items
  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let isMounted = true;
    const loadingTimeout = setTimeout(() => {
      if (loading && isMounted) {
        setLoading(false);
        toast({
          title: "Loading timeout",
          description: "Taking longer than expected to load tasks. Please try again.",
          variant: "destructive"
        });
      }
    }, 10000); // 10 second timeout

    async function loadData() {
      try {
        setLoading(true);
        // Load clients first, then tasks to avoid rendering issues
        const clientsData = await getClients();
        if (isMounted) setClients(clientsData);
        
        const tasksData = await getTasks();
        if (isMounted) setTasks(tasksData);
      } catch (error) {
        console.error("Error loading data:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load tasks. Please check your connection.",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [toast]);

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

  const getClientName = (clientId: string) => {
    const client = clients.find(client => client.id === clientId);
    if (client) return client.name;
    
    // Fallback - if clients aren't loaded yet, use a placeholder with id
    return clientId ? `Client (${clientId.substring(0, 4)}...)` : "No client";
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // Format date for display
  const formatScheduledDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Filter tasks based on the selected filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      return filter === "all" || task.status === filter
    })
  }, [tasks, filter])

  // Group tasks by due date periods
  const groupedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = addDays(today, 1);
    const thisWeekStart = startOfWeek(today);
    const thisWeekEnd = endOfWeek(today);
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);
    const nextMonthStart = startOfMonth(addMonths(today, 1));
    const nextMonthEnd = endOfMonth(addMonths(today, 1));
    
    const groups: Record<string, Task[]> = {
      "Overdue": [],
      "Today": [],
      "This week": [],
      "This month": [],
      "Next month": [],
      "Future": []
    };
    
    filteredTasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (isBefore(dueDate, today)) {
        groups["Overdue"].push(task);
      } else if (isToday(dueDate) || isSameDay(dueDate, today)) {
        groups["Today"].push(task);
      } else if (isAfter(dueDate, thisWeekStart) && isBefore(dueDate, thisWeekEnd)) {
        groups["This week"].push(task);
      } else if (isAfter(dueDate, thisMonthStart) && isBefore(dueDate, thisMonthEnd)) {
        groups["This month"].push(task);
      } else if (isAfter(dueDate, nextMonthStart) && isBefore(dueDate, nextMonthEnd)) {
        groups["Next month"].push(task);
      } else {
        groups["Future"].push(task);
      }
    });
    
    // Filter out empty groups
    return Object.entries(groups)
      .filter(([_, tasks]) => tasks.length > 0)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, Task[]>);
  }, [filteredTasks]);

  // Initialize expanded state for all groups
  useEffect(() => {
    if (!loading && Object.keys(groupedTasks).length > 0) {
      const initialExpandedState = Object.keys(groupedTasks).reduce((acc, group) => {
        acc[group] = true; // Default all groups to expanded
        return acc;
      }, {} as Record<string, boolean>);
      
      setExpandedGroups(initialExpandedState);
    }
  }, [loading, groupedTasks]);

  // Define table columns
  const columns: ColumnDef<Task>[] = [
    {
      id: "title",
      header: "Task Title",
      accessorFn: (row) => row.title,
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="w-full group whitespace-nowrap overflow-hidden">
            <span 
              className="cursor-pointer hover:underline font-medium truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
              onClick={() => setViewTask(task)}
            >
              {task.title}
            </span>
            <div className="hidden group-hover:flex items-center gap-1 absolute right-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTask(task);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTaskState(task);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      },
      enableSorting: true,
      width: "20%",
    },
    {
      id: "client",
      header: "Client",
      accessorFn: (row) => getClientName(row.clientId),
      enableSorting: true,
      enableFiltering: false,
      width: "18%",
      cell: ({ row }) => (
        <div className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
          {getClientName(row.original.clientId)}
        </div>
      ),
    },
    {
      id: "dueDate",
      header: "Due Date",
      accessorFn: (row) => row.dueDate,
      cell: ({ row }) => (
        <div className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
          {formatDate(row.original.dueDate)}
        </div>
      ),
      enableSorting: true,
      width: "15%",
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      cell: ({ row }) => (
        <div className="overflow-hidden whitespace-nowrap">
          <Badge className={`rounded-sm text-xs font-normal ${getStatusColor(row.original.status)}`}>
            {getStatusLabel(row.original.status)}
          </Badge>
        </div>
      ),
      enableSorting: true,
      width: "12%",
    },
    {
      id: "duration",
      header: "Duration",
      accessorFn: (row) => row.estimatedDuration,
      cell: ({ row }) => (
        <div className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
          {`${row.original.estimatedDuration} min`}
        </div>
      ),
      enableSorting: true,
      width: "10%",
    },
    {
      id: "scheduledTime",
      header: "Scheduled Time",
      accessorFn: (row) => row.startTime || "",
      cell: ({ row }) => {
        const task = row.original
        
        if (task.startTime && task.endTime) {
          return (
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Start:</span>{" "}
                {task.startDate && new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                {task.startTime}
              </div>
              <div>
                <span className="font-medium">End:</span>{" "}
                {task.endDate && new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                {task.endTime}
              </div>
            </div>
          )
        }
        
        return <span className="text-muted-foreground text-sm">Not scheduled</span>
      },
      enableSorting: false,
      width: "17%",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  // Toggle group expansion
  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Toggle showing all items for a group
  const toggleShowAllItems = (group: string) => {
    setShowAllItems(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const ViewTaskDialog = ({
    task,
    isOpen,
    onClose,
  }: {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!task) return null;
    
    return (
      <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <PopoverTrigger asChild>
          <div style={{ display: 'none' }} />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 border-b">
            <h3 className="text-base font-medium">{task.title}</h3>
            <div className="mt-1">
              <Badge className={`rounded-sm text-xs font-normal ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Client</div>
                <div className="text-sm truncate">{getClientName(task.clientId)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Due Date</div>
                <div className="text-sm">{formatDate(task.dueDate)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="text-sm">{task.estimatedDuration} mins</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm">{getStatusLabel(task.status)}</div>
              </div>
            </div>
            
            {task.startTime && task.endTime && (
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div className="text-sm">
                    {task.startDate ? `${formatScheduledDate(task.startDate)} ` : ""}
                    {task.startTime}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End</div>
                  <div className="text-sm">
                    {task.endDate ? `${formatScheduledDate(task.endDate)} ` : ""}
                    {task.endTime}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-3 pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  onClose();
                  setEditTask(task);
                }}
              >
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="h-8"
                onClick={() => {
                  onClose();
                  setDeleteTaskState(task);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <>
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No tasks match the selected filter.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => {
            // Determine if we should limit the tasks shown
            const isExpanded = expandedGroups[group] ?? true;
            const showAll = showAllItems[group] ?? false;
            const hasMoreTasks = groupTasks.length > 50;
            const displayTasks = showAll ? groupTasks : groupTasks.slice(0, 50);
            
            return (
              <div key={group}>
                <div className="border-t border-slate-200 mb-1">
                  <div 
                    className="flex items-center justify-between cursor-pointer h-7 group"
                    onClick={() => toggleGroupExpansion(group)}
                  >
                    <div className="flex items-center gap-1">
                      {isExpanded ? 
                        <ChevronUp className="h-3 w-3 text-slate-500" /> : 
                        <ChevronDown className="h-3 w-3 text-slate-500" />
                      }
                      <h3 className="text-xs font-medium text-slate-600">{group}</h3>
                      <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0 h-4">
                        {groupTasks.length}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div>
                    <DataTable
                      columns={columns}
                      data={displayTasks}
                      initialSortColumn="dueDate"
                      initialSortDirection="asc"
                      showFilters={false}
                    />
                    
                    {hasMoreTasks && (
                      <div className="mt-1 text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowAllItems(group);
                          }}
                        >
                          {showAll ? "Show less" : `Show all (${groupTasks.length})`}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewTask && (
        <ViewTaskDialog 
          task={viewTask}
          isOpen={!!viewTask} 
          onClose={() => {
            setViewTask(null);
          }}
        />
      )}
      
      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={() => setEditTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
      
      {deleteTaskState && (
        <DeleteTaskDialog
          task={deleteTaskState}
          open={!!deleteTaskState}
          onOpenChange={() => setDeleteTaskState(null)}
          onDelete={() => handleDeleteTask(deleteTaskState)}
        />
      )}

      {scheduleTask && (
        <ScheduleTimeDialog
          task={scheduleTask}
          open={!!scheduleTask}
          onOpenChange={() => setScheduleTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </>
  )
} 