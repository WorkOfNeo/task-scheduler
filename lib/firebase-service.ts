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

// Types based on mock data structure
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  hourlyRate?: number;
  monthlyWage?: number;
  activeTasks: number;
  completedTasks: number;
  createdAt?: any;
}

export interface Task {
  id: string;
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
  createdAt?: any;
}

export interface ScheduleItem {
  id: string;
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

// Clients
export async function getClients() {
  try {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
      clients.push({
        id: doc.id,
        ...doc.data(),
        activeTasks: doc.data().activeTasks || 0,
        completedTasks: doc.data().completedTasks || 0
      } as Client);
    });
    
    return clients;
  } catch (error) {
    console.error('Error getting clients:', error);
    return [];
  }
}

export async function getClient(id: string) {
  try {
    const docRef = doc(db, 'clients', id);
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

export async function addClient(client: Omit<Client, 'id' | 'activeTasks' | 'completedTasks' | 'createdAt'>) {
  try {
    const clientsRef = collection(db, 'clients');
    const newClient = {
      ...client,
      activeTasks: 0,
      completedTasks: 0,
      createdAt: serverTimestamp()
    };
    
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
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

export async function deleteClient(id: string) {
  try {
    // First, delete all tasks associated with the client
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('clientId', '==', id));
    const querySnapshot = await getDocs(q);
    
    const deleteTasks = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deleteTasks);
    
    // Then delete the client
    const docRef = doc(db, 'clients', id);
    await deleteDoc(docRef);
    return { id };
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}

// Tasks
export async function getTasks(constraints: QueryConstraint[] = []) {
  try {
    console.log("Fetching tasks with constraints:", constraints);
    const tasksRef = collection(db, 'tasks');
    const defaultConstraints = [orderBy('createdAt', 'desc')];
    const q = query(tasksRef, ...constraints, ...defaultConstraints);
    console.log("Executing Firestore query...");
    const querySnapshot = await getDocs(q);
    console.log("Query completed. Number of tasks:", querySnapshot.size);
    
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Task data:", { id: doc.id, ...data });
      tasks.push({
        id: doc.id,
        ...data
      } as Task);
    });
    
    console.log("Successfully processed", tasks.length, "tasks");
    return tasks;
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return [];
  }
}

export async function getIncompleteTasks() {
  try {
    const tasksRef = collection(db, 'tasks');
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

export async function getUpcomingTasks(limit = 5) {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('status', 'in', ['todo', 'in-progress']),
      orderBy('dueDate', 'asc'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      } as Task);
    });
    
    return tasks.slice(0, limit);
  } catch (error) {
    console.error('Error getting upcoming tasks:', error);
    return [];
  }
}

export async function getClientTasks(clientId: string) {
  return getTasks([where('clientId', '==', clientId)]);
}

export async function getTask(id: string) {
  try {
    const docRef = doc(db, 'tasks', id);
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

export async function addTask(task: Omit<Task, 'id' | 'createdAt'>) {
  try {
    // Add the task
    const tasksRef = collection(db, 'tasks');
    const newTask = {
      ...task,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(tasksRef, newTask);
    
    // Update client's active task count
    const clientRef = doc(db, 'clients', task.clientId);
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
    const docRef = doc(db, 'tasks', id);
    const taskDoc = await getDoc(docRef);
    
    if (taskDoc.exists()) {
      const oldStatus = taskDoc.data().status;
      const newStatus = data.status;
      
      await updateDoc(docRef, data);
      
      // If status changed, update client's task counts
      if (newStatus && oldStatus !== newStatus) {
        const clientId = taskDoc.data().clientId;
        const clientRef = doc(db, 'clients', clientId);
        const clientDoc = await getDoc(clientRef);
        
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          
          if (oldStatus !== 'done' && newStatus === 'done') {
            // Task completed
            await updateDoc(clientRef, {
              activeTasks: Math.max((clientData.activeTasks || 0) - 1, 0),
              completedTasks: (clientData.completedTasks || 0) + 1
            });
          } else if (oldStatus === 'done' && newStatus !== 'done') {
            // Task moved from done to in-progress or todo
            await updateDoc(clientRef, {
              activeTasks: (clientData.activeTasks || 0) + 1,
              completedTasks: Math.max((clientData.completedTasks || 0) - 1, 0)
            });
          }
        }
      }
      
      return { id, ...data };
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(id: string) {
  try {
    const docRef = doc(db, 'tasks', id);
    const taskDoc = await getDoc(docRef);
    
    if (taskDoc.exists()) {
      const taskData = taskDoc.data();
      const clientId = taskData.clientId;
      const status = taskData.status;
      
      await deleteDoc(docRef);
      
      // Update client's task counts
      const clientRef = doc(db, 'clients', clientId);
      const clientDoc = await getDoc(clientRef);
      
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        
        if (status === 'done') {
          await updateDoc(clientRef, {
            completedTasks: Math.max((clientData.completedTasks || 0) - 1, 0)
          });
        } else {
          await updateDoc(clientRef, {
            activeTasks: Math.max((clientData.activeTasks || 0) - 1, 0)
          });
        }
      }
      
      return { id };
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Schedule
export async function getScheduleForDate(date: string) {
  try {
    const scheduleRef = collection(db, 'schedule');
    const q = query(scheduleRef, where('date', '==', date));
    const querySnapshot = await getDocs(q);
    
    const scheduleItems: ScheduleItem[] = [];
    querySnapshot.forEach((doc) => {
      scheduleItems.push({
        id: doc.id,
        ...doc.data()
      } as ScheduleItem);
    });
    
    return scheduleItems;
  } catch (error) {
    console.error('Error getting schedule:', error);
    return [];
  }
}

export async function addScheduleItem(item: Omit<ScheduleItem, 'id' | 'createdAt'>) {
  try {
    const scheduleRef = collection(db, 'schedule');
    const newItem = {
      ...item,
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
    const docRef = doc(db, 'schedule', id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error) {
    console.error('Error updating schedule item:', error);
    throw error;
  }
}

export async function deleteScheduleItem(id: string) {
  try {
    const docRef = doc(db, 'schedule', id);
    await deleteDoc(docRef);
    return { id };
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    throw error;
  }
}

// Analytics
export async function getTaskStats() {
  try {
    const tasksRef = collection(db, 'tasks');
    const querySnapshot = await getDocs(tasksRef);
    
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    
    querySnapshot.forEach((doc) => {
      const task = doc.data();
      if (task.status === 'todo') todoCount++;
      else if (task.status === 'in-progress') inProgressCount++;
      else if (task.status === 'done') doneCount++;
    });
    
    return {
      todoCount,
      inProgressCount, 
      doneCount,
      totalCount: todoCount + inProgressCount + doneCount
    };
  } catch (error) {
    console.error('Error getting task stats:', error);
    return {
      todoCount: 0,
      inProgressCount: 0,
      doneCount: 0,
      totalCount: 0
    };
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