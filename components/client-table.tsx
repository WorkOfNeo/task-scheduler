"use client"

import { useMemo, useState, useEffect } from "react"
import { DataTable, ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, MoreHorizontal, Building2, Mail, Phone, DollarSign, Calendar, Columns, GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Client } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { useClients } from "@/lib/clients-context"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"
import { CurrencyFormatter } from "@/components/currency-formatter"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ClientTableProps {
  filter: "all" | "active" | "inactive"
}

export function ClientTable({ filter }: ClientTableProps) {
  const { clients, loading, error, deleteClient } = useClients()
  const { toast } = useToast()
  const router = useRouter()
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    // Try to load from localStorage, fallback to default order
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clientTableColumnOrder')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved column order:', e)
        }
      }
    }
    return [
      "name",
      "email",
      "phone",
      "hourlyRate",
      "monthlyWage",
      "activeTasks",
      "completedTasks",
      "createdAt",
      "actions"
    ]
  })

  // Save column order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('clientTableColumnOrder', JSON.stringify(columnOrder))
  }, [columnOrder])

  const columns: ColumnDef<Client>[] = [
    {
      id: "name",
      header: "Client Name",
      accessorFn: (row) => row.name,
      cell: ({ row }) => {
        const client = row.original
        return (
          <button
            onClick={() => router.push(`/clients/${client.id}`)}
            className="flex items-center space-x-2 hover:underline text-left w-full"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.name}</span>
          </button>
        )
      },
      enableHiding: true
    },
    {
      id: "email",
      header: "Email",
      accessorFn: (row) => row.email,
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{client.email}</span>
          </div>
        )
      },
      enableHiding: true
    },
    {
      id: "phone",
      header: "Phone",
      accessorFn: (row) => row.phone,
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{client.phone || "N/A"}</span>
          </div>
        )
      },
      enableHiding: true
    },
    {
      id: "hourlyRate",
      header: "Hourly Rate",
      accessorFn: (row) => row.hourlyRate,
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{client.hourlyRate ? <CurrencyFormatter amount={client.hourlyRate} /> + '/hr' : "N/A"}</span>
          </div>
        )
      },
      enableHiding: true
    },
    {
      id: "monthlyWage",
      header: "Monthly Wage",
      accessorFn: (row) => row.monthlyWage,
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{client.monthlyWage ? <CurrencyFormatter amount={client.monthlyWage} /> + '/month' : "N/A"}</span>
          </div>
        )
      },
      enableHiding: true
    },
    {
      id: "activeTasks",
      header: "Active Tasks",
      accessorFn: (row) => row.activeTasks,
      cell: ({ row }) => {
        const client = row.original
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
            {client.activeTasks} active
          </Badge>
        )
      },
      enableHiding: true
    },
    {
      id: "completedTasks",
      header: "Completed Tasks",
      accessorFn: (row) => row.completedTasks,
      cell: ({ row }) => {
        const client = row.original
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            {client.completedTasks} completed
          </Badge>
        )
      },
      enableHiding: true
    },
    {
      id: "createdAt",
      header: "Created At",
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => {
        const client = row.original
        const date = client.createdAt ? new Date(client.createdAt) : null
        const isValidDate = date instanceof Date && !isNaN(date.getTime())
        
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{isValidDate ? format(date, "MMM d, yyyy") : "N/A"}</span>
          </div>
        )
      },
      enableHiding: true
    },
    {
      id: "actions",
      header: "Actions",
      accessorFn: () => null,
      cell: ({ row }) => {
        const client = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteClient(client.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(columnOrder)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setColumnOrder(items)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error loading clients</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={clients}
      searchKey="name"
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      columnVisibilityButton={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1"
                  >
                    {columnOrder
                      .filter(columnId => columns.find(col => col.id === columnId)?.enableHiding !== false)
                      .map((columnId, index) => {
                        const column = columns.find(col => col.id === columnId)
                        if (!column) return null
                        
                        return (
                          <Draggable
                            key={columnId}
                            draggableId={columnId}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-md",
                                  snapshot.isDragging 
                                    ? "bg-accent text-accent-foreground" 
                                    : "hover:bg-accent/50 cursor-pointer"
                                )}
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">{column.header}</span>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  )
} 