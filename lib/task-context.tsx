"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, updateTask } from '@/lib/firebase-service';
import { useToast } from '@/components/ui/use-toast';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  handleCompleteTask: (task: Task) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch tasks logic here
    setLoading(false);
  }, []);

  const handleCompleteTask = async (task: Task) => {
    if (task.status === 'done') return;
    const alreadyTracked = task.trackedHours || 0;
    const expectedHours = task.estimatedDuration / 60;
    const hoursToAdd = Math.max(expectedHours - alreadyTracked, 0);
    const newTracked = alreadyTracked + hoursToAdd;
    try {
      await updateTask(task.id, {
        status: 'done',
        trackedHours: newTracked,
        completedAt: new Date().toISOString().split('T')[0],
      });
      console.log(`Task "${task.title}" completed successfully.`);
      toast({
        title: "Task Completed",
        description: `"${task.title}" has been marked as done.`,
      });
      // Update local state
      setTasks(prevTasks => prevTasks.map(t => t.id === task.id ? { ...t, status: 'done', trackedHours: newTracked } : t));
    } catch (error) {
      console.error('Failed to complete task', error);
      toast({
        title: "Error",
        description: "Failed to complete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, handleCompleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}; 