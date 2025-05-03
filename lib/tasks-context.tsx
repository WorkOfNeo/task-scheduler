"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Task, getTasks, addTask as addTaskToDb, updateTask as updateTaskInDb, deleteTask as deleteTaskFromDb } from '@/lib/firebase-service'
import { useToast } from '@/components/ui/use-toast'
import { useAuthContext } from '@/lib/auth-context'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getUserTasksPath } from '@/lib/firebase-service'

interface TasksContextType {
  tasks: Task[]
  loading: boolean
  error: Error | null
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  refreshTasks: () => Promise<void>
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const tasksRef = collection(db, getUserTasksPath(user.uid))
    const q = query(tasksRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tasks: Task[] = []
        snapshot.forEach((doc) => {
          tasks.push({
            id: doc.id,
            ...doc.data()
          } as Task)
        })
        setTasks(tasks)
        setError(null)
        setLoading(false)
      },
      (error) => {
        console.error('Error in tasks snapshot:', error)
        setError(error instanceof Error ? error : new Error('Failed to fetch tasks'))
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive"
        })
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('Must be authenticated to add tasks')
    }

    try {
      await addTaskToDb(task)
      toast({
        title: "Success",
        description: "Task added successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      })
      throw err
    }
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    if (!user) {
      throw new Error('Must be authenticated to update tasks')
    }

    try {
      await updateTaskInDb(id, data)
      toast({
        title: "Success",
        description: "Task updated successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      })
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    if (!user) {
      throw new Error('Must be authenticated to delete tasks')
    }

    try {
      await deleteTaskFromDb(id)
      toast({
        title: "Success",
        description: "Task deleted successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      })
      throw err
    }
  }

  const refreshTasks = async () => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const fetchedTasks = await getTasks()
      setTasks(fetchedTasks)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TasksContext.Provider value={{
      tasks,
      loading,
      error,
      addTask,
      updateTask,
      deleteTask,
      refreshTasks
    }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
} 