"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Client, addClient as addClientToDb, updateClient as updateClientInDb, deleteClient as deleteClientFromDb } from '@/lib/firebase-service'
import { useToast } from '@/components/ui/use-toast'
import { useAuthContext } from '@/lib/auth-context'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getUserClientsPath } from '@/lib/firebase-service'

interface ClientsContextType {
  clients: Client[]
  loading: boolean
  error: Error | null
  addClient: (client: Omit<Client, 'id' | 'activeTasks' | 'completedTasks' | 'createdAt' | 'userId'>) => Promise<void>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user) {
      setClients([])
      setLoading(false)
      return
    }

    setLoading(true)
    const clientsRef = collection(db, getUserClientsPath(user.uid))
    const q = query(clientsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const clients: Client[] = []
        snapshot.forEach((doc) => {
          clients.push({
            id: doc.id,
            ...doc.data(),
            activeTasks: doc.data().activeTasks || 0,
            completedTasks: doc.data().completedTasks || 0
          } as Client)
        })
        setClients(clients)
        setError(null)
        setLoading(false)
      },
      (error) => {
        console.error('Error in clients snapshot:', error)
        setError(error instanceof Error ? error : new Error('Failed to fetch clients'))
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive"
        })
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const addClient = async (client: Omit<Client, 'id' | 'activeTasks' | 'completedTasks' | 'createdAt' | 'userId'>) => {
    if (!user) {
      throw new Error('Must be authenticated to add clients')
    }

    try {
      await addClientToDb(client)
      toast({
        title: "Success",
        description: "Client added successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      })
      throw err
    }
  }

  const updateClient = async (id: string, data: Partial<Client>) => {
    if (!user) {
      throw new Error('Must be authenticated to update clients')
    }

    try {
      await updateClientInDb(id, data)
      toast({
        title: "Success",
        description: "Client updated successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive"
      })
      throw err
    }
  }

  const deleteClient = async (id: string) => {
    if (!user) {
      throw new Error('Must be authenticated to delete clients')
    }

    try {
      await deleteClientFromDb(id)
      toast({
        title: "Success",
        description: "Client deleted successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      })
      throw err
    }
  }

  return (
    <ClientsContext.Provider value={{
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient
    }}>
      {children}
    </ClientsContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientsContext)
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider')
  }
  return context
} 