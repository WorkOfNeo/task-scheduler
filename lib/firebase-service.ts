"use client"

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  DocumentData,
  serverTimestamp,
  QueryConstraint,
  getDoc,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

// Types based on mock data structure
export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  vat?: string;
  invoiceEmail?: string;
  currency?: string;
  hourlyRate?: number;
  monthlyWage?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
  activeTasks?: number;
  completedTasks?: number;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  description: string;
  estimatedDuration: number; // in minutes
  dueDate: string;
  status: 'todo' | 'in-progress' | 'done';
  startTime?: string; // Time string format "HH:MM"
  endTime?: string; // Time string format "HH:MM"
  startDate?: string; // ISO format date string (YYYY-MM-DD)
  endDate?: string; // ISO format date string (YYYY-MM-DD)
  trackedHours?: number; // Hours tracked for this task
  revenue?: number; // Revenue generated from this task
  completedAt?: string; // ISO format date string (YYYY-MM-DD)
  createdAt?: any;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  taskId: string;
  title: string;
  client: string;
  clientId: string;
  duration: number;
  timeSlot: number;
  locked: boolean;
  date: string; // ISO format date string (YYYY-MM-DD)
  createdAt?: any;
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  lastLogin: Date
}

// Helper function to get current user ID
function getCurrentUserId() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to perform this action');
  }
  return user.uid;
}

// Helper function to get user's data path
export function getUserDataPath(userId: string) {
  return `users/${userId}`;
}

// Helper function to get user's clients path
export function getUserClientsPath(userId: string) {
  return `${getUserDataPath(userId)}/clients`;
}

// Helper function to get user's tasks path
export function getUserTasksPath(userId: string) {
  return `${getUserDataPath(userId)}/tasks`;
}

// Helper function to get user's schedule path
export function getUserSchedulePath(userId: string) {
  return `${getUserDataPath(userId)}/schedule`;
}

// Clients
export async function getClients(userId: string) {
  try {
    const clientsRef = collection(db, getUserClientsPath(userId))
    const snapshot = await getDocs(clientsRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client))
  } catch (error) {
    console.error('Error getting clients:', error)
    throw error
  }
}

export async function getClient(id: string) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, getUserClientsPath(userId), id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        activeTasks: docSnap.data().activeTasks || 0,
        completedTasks: docSnap.data().completedTasks || 0
      } as Client;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting client:', error);
    return null;
  }
}

export async function addClient(client: Omit<Client, 'id' | 'activeTasks' | 'completedTasks' | 'createdAt' | 'userId'>) {
  try {
    const userId = getCurrentUserId();
    const clientsRef = collection(db, getUserClientsPath(userId));
    
    // Create base client data with required fields
    const newClient: any = {
      name: client.name,
      email: client.email,
      activeTasks: 0,
      completedTasks: 0,
      createdAt: serverTimestamp()
    };
    
    // Only add optional fields if they have values
    if (client.phone) newClient.phone = client.phone;
    if (client.address) newClient.address = client.address;
    if (client.zip) newClient.zip = client.zip;
    if (client.city) newClient.city = client.city;
    if (client.country) newClient.country = client.country;
    if (client.vat) newClient.vat = client.vat;
    if (client.invoiceEmail) newClient.invoiceEmail = client.invoiceEmail;
    if (client.currency) newClient.currency = client.currency;
    if (typeof client.hourlyRate === 'number') newClient.hourlyRate = client.hourlyRate;
    if (typeof client.monthlyWage === 'number') newClient.monthlyWage = client.monthlyWage;
    
    const docRef = await addDoc(clientsRef, newClient);
    return {
      id: docRef.id,
      ...newClient
    };
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
}

export async function updateClient(id: string, data: Partial<Client>) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, getUserClientsPath(userId), id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Client not found');
    }
    
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

export async function deleteClient(clientId: string) {
  try {
    // First, get all tasks associated with this client
    const tasks = await getClientTasks(clientId);
    
    // Delete all associated tasks
    const deleteTaskPromises = tasks.map(task => deleteDoc(doc(db, "tasks", task.id)));
    await Promise.all(deleteTaskPromises);
    
    // Finally, delete the client
    await deleteDoc(doc(db, "clients", clientId));
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
}

// Tasks
export async function getTasks(userId: string) {
  try {
    const tasksRef = collection(db, getUserTasksPath(userId))
    const snapshot = await getDocs(tasksRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task))
  } catch (error) {
    console.error('Error getting tasks:', error)
    throw error
  }
}

export async function getIncompleteTasks() {
  try {
    const userId = getCurrentUserId();
    const tasksRef = collection(db, getUserTasksPath(userId));
    const q = query(
      tasksRef, 
      where('status', 'in', ['todo', 'in-progress']),
      orderBy('dueDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      } as Task);
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting incomplete tasks:', error);
    return [];
  }
}

export async function getUpcomingTasks(userId: string) {
  try {
    const tasksRef = collection(db, getUserTasksPath(userId))
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const q = query(
      tasksRef,
      where('dueDate', '>=', now.toISOString()),
      where('dueDate', '<=', nextWeek.toISOString()),
      orderBy('dueDate', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task))
  } catch (error) {
    console.error('Error getting upcoming tasks:', error)
    throw error
  }
}

export async function getClientTasks(clientId: string) {
  try {
    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      where("clientId", "==", clientId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  } catch (error) {
    console.error("Error getting client tasks:", error);
    throw error;
  }
}

export async function getTask(id: string) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, getUserTasksPath(userId), id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Task;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting task:', error);
    return null;
  }
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'userId'>) {
  try {
    const userId = getCurrentUserId();
    const tasksRef = collection(db, getUserTasksPath(userId));
    const newTask = {
      ...task,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(tasksRef, newTask);
    
    // Update client's active task count
    const clientRef = doc(db, getUserClientsPath(userId), task.clientId);
    const clientDoc = await getDoc(clientRef);
    
    if (clientDoc.exists()) {
      const clientData = clientDoc.data();
      await updateDoc(clientRef, {
        activeTasks: (clientData.activeTasks || 0) + 1
      });
    }
    
    return {
      id: docRef.id,
      ...newTask
    };
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

export async function updateTask(id: string, data: Partial<Task>) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, getUserTasksPath(userId), id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      throw new Error('Task not found or unauthorized');
    }

    const oldData = docSnap.data() as Task;
    const newData = { ...oldData, ...data };

    // If task is being marked as done, calculate revenue and update client stats
    if (data.status === 'done' && oldData.status !== 'done') {
      const clientRef = doc(db, getUserClientsPath(userId), oldData.clientId);
      const clientDoc = await getDoc(clientRef);
      
      if (clientDoc.exists()) {
        const clientData = clientDoc.data() as Client;
        const hourlyRate = clientData.hourlyRate || 0;
        const trackedHours = newData.trackedHours || 0;
        const taskRevenue = hourlyRate * trackedHours;
        
        // Update task with revenue and completion date
        newData.revenue = taskRevenue;
        newData.completedAt = new Date().toISOString();
        
        // Update client stats
        const now = new Date();
        const isCurrentMonth = new Date(oldData.createdAt?.toDate()).getMonth() === now.getMonth();
        
        await updateDoc(clientRef, {
          completedTasks: (clientData.completedTasks || 0) + 1,
          totalRevenue: (clientData.totalRevenue || 0) + taskRevenue,
          monthlyRevenue: isCurrentMonth ? (clientData.monthlyRevenue || 0) + taskRevenue : clientData.monthlyRevenue || 0
        });
      }
    }
    
    await updateDoc(docRef, newData);
    return { id, ...newData };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(id: string) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'tasks', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      throw new Error('Task not found or unauthorized');
    }
    
    const taskData = docSnap.data();
    await deleteDoc(docRef);
    
    // Update client's active task count
    if (taskData.clientId) {
      const clientRef = doc(db, 'clients', taskData.clientId);
      const clientDoc = await getDoc(clientRef);
      
      if (clientDoc.exists() && clientDoc.data().userId === userId) {
        const clientData = clientDoc.data();
        await updateDoc(clientRef, {
          activeTasks: Math.max(0, (clientData.activeTasks || 0) - 1)
        });
      }
    }
    
    return { id };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Schedule
export async function getScheduleItems() {
  try {
    const userId = getCurrentUserId();
    const scheduleRef = collection(db, 'schedule');
    const q = query(
      scheduleRef,
      where('userId', '==', userId),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const items: ScheduleItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as ScheduleItem);
    });
    
    return items;
  } catch (error) {
    console.error('Error getting schedule items:', error);
    return [];
  }
}

export async function addScheduleItem(item: Omit<ScheduleItem, 'id' | 'createdAt' | 'userId'>) {
  try {
    const userId = getCurrentUserId();
    const scheduleRef = collection(db, 'schedule');
    const newItem = {
      ...item,
      userId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(scheduleRef, newItem);
    return {
      id: docRef.id,
      ...newItem
    };
  } catch (error) {
    console.error('Error adding schedule item:', error);
    throw error;
  }
}

export async function updateScheduleItem(id: string, data: Partial<ScheduleItem>) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'schedule', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      throw new Error('Schedule item not found or unauthorized');
    }
    
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating schedule item:', error);
    throw error;
  }
}

export async function deleteScheduleItem(id: string) {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'schedule', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      throw new Error('Schedule item not found or unauthorized');
    }
    
    await deleteDoc(docRef);
    return { id };
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    throw error;
  }
}

// Analytics
export async function getTaskStats(userId: string) {
  try {
    const tasksRef = collection(db, getUserTasksPath(userId))
    const snapshot = await getDocs(tasksRef)
    
    const stats = {
      todoCount: 0,
      inProgressCount: 0,
      doneCount: 0,
      totalCount: 0,
    }

    snapshot.forEach((doc) => {
      const task = doc.data()
      stats.totalCount++
      switch (task.status) {
        case 'todo':
          stats.todoCount++
          break
        case 'in-progress':
          stats.inProgressCount++
          break
        case 'done':
          stats.doneCount++
          break
      }
    })

    return stats
  } catch (error) {
    console.error('Error getting task stats:', error)
    throw error
  }
}

export async function getTasksByDate(startDate: Date, endDate: Date) {
  try {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('dueDate', '>=', `${formattedStartDate}T00:00:00.000Z`),
      where('dueDate', '<=', `${formattedEndDate}T23:59:59.999Z`)
    );
    
    const querySnapshot = await getDocs(q);
    
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      } as Task);
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks by date range:', error);
    return [];
  }
}

export async function createUserProfile(userId: string, email: string, name: string): Promise<User> {
  const userRef = doc(db, 'users', userId)
  const userData: User = {
    id: userId,
    email,
    name,
    role: 'user', // Default role is user
    createdAt: new Date(),
    lastLogin: new Date()
  }
  
  await setDoc(userRef, userData)
  return userData
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    lastLogin: new Date()
  })
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    return userSnap.data() as User
  }
  return null
}

export async function getAllUsers(): Promise<User[]> {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[]
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, { role })
}

// Super Admin Functions
export async function getAllClients(): Promise<(Client & { createdBy: string })[]> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const allClients: (Client & { createdBy: string })[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const clientsRef = collection(db, getUserClientsPath(userId));
      const clientsSnapshot = await getDocs(clientsRef);
      
      clientsSnapshot.forEach((doc) => {
        allClients.push({
          id: doc.id,
          ...doc.data(),
          createdBy: userId
        } as Client & { createdBy: string });
      });
    }

    return allClients;
  } catch (error) {
    console.error('Error getting all clients:', error);
    return [];
  }
}

export async function getClientWithUser(clientId: string, userId: string): Promise<(Client & { createdBy: string }) | null> {
  try {
    const docRef = doc(db, getUserClientsPath(userId), clientId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdBy: userId
      } as Client & { createdBy: string };
    }
    return null;
  } catch (error) {
    console.error('Error getting client with user:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, data)
}

// Add new function to get dashboard statistics
export async function getDashboardStats(userId: string) {
  try {
    const tasksRef = collection(db, getUserTasksPath(userId));
    const clientsRef = collection(db, getUserClientsPath(userId));
    
    const [tasksSnapshot, clientsSnapshot] = await Promise.all([
      getDocs(tasksRef),
      getDocs(clientsRef)
    ]);

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));

    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Open tasks (with tracked time but not closed)
    const openTasks = tasks.filter(task => 
      task.status !== 'done' && 
      task.trackedHours && 
      task.trackedHours > 0
    );

    // Not started tasks (no tracked time, with deadline)
    const notStartedTasks = tasks.filter(task => 
      task.status !== 'done' && 
      (!task.trackedHours || task.trackedHours === 0)
    );

    // Get latest deadline from not started tasks
    const latestDeadline = notStartedTasks.length > 0
      ? new Date(Math.max(...notStartedTasks.map(task => new Date(task.dueDate).getTime())))
      : null;

    // Completed tasks this month
    const completedThisMonth = tasks.filter(task => 
      task.status === 'done' && 
      task.completedAt && 
      new Date(task.completedAt) >= startOfMonth &&
      new Date(task.completedAt) <= endOfMonth
    );

    // Calculate revenue from completed tasks this month
    const taskRevenue = completedThisMonth.reduce((total, task) => {
      const client = clients.find(c => c.id === task.clientId);
      if (client && client.hourlyRate && task.trackedHours) {
        return total + (task.trackedHours * client.hourlyRate);
      }
      return total;
    }, 0);

    // Add monthly wages from clients
    const monthlyWages = clients.reduce((total, client) => 
      total + (client.monthlyWage || 0), 0
    );

    // Total monthly revenue (task revenue + monthly wages)
    const revenueThisMonth = taskRevenue + monthlyWages;

    return {
      openTasks: openTasks.length,
      notStartedTasks: {
        count: notStartedTasks.length,
        latestDeadline: latestDeadline?.toISOString() || null
      },
      completedThisMonth: completedThisMonth.length,
      hoursThisMonth: completedThisMonth.reduce((total, task) => total + (task.trackedHours || 0), 0),
      revenueThisMonth
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
} 