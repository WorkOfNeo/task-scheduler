"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuthContext } from './auth-context'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getCurrentUserId } from "@/lib/firebase-service"

interface CurrencySettings {
  code: string;
  symbol: string;
  position: 'before' | 'after';
}

interface Schedule {
  id: string;
  days: string[];
  from: string;
  to: string;
}

interface Settings {
  currency: CurrencySettings;
  schedules?: Schedule[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  schedules: Schedule[];
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, schedule: Schedule) => void;
  removeSchedule: (id: string) => void;
}

const defaultSettings: Settings = {
  currency: {
    code: 'EUR',
    symbol: '€',
    position: 'before'
  },
  schedules: []
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [schedules, setSchedules] = useState<Schedule[]>([])

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const userId = getCurrentUserId()
      const settingsRef = doc(db, 'users', userId, 'settings', 'general')
      const settingsDoc = await getDoc(settingsRef)
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setSettings({
          ...defaultSettings,
          ...data
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const userId = getCurrentUserId()
      const settingsRef = doc(db, 'users', userId, 'settings', 'general')
      const updatedSettings = { ...settings, ...newSettings }
      await setDoc(settingsRef, updatedSettings)
      setSettings(updatedSettings)
    } catch (error) {
      console.error("Error updating settings:", error)
      throw error
    }
  }

  const addSchedule = (schedule: Schedule) => {
    setSchedules([...schedules, schedule])
  }

  const updateSchedule = (id: string, schedule: Schedule) => {
    setSchedules(schedules.map(s => s.id === id ? schedule : s))
  }

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id))
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      schedules,
      addSchedule,
      updateSchedule,
      removeSchedule
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
} 