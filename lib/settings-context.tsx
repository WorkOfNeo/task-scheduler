"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthContext } from './auth-context'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface CurrencySettings {
  code: string;
  symbol: string;
  position: 'before' | 'after';
}

interface Settings {
  currency: CurrencySettings;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  currency: {
    code: 'DKK',
    symbol: 'kr',
    position: 'after'
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    async function loadSettings() {
      if (!user) return

      const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as Settings)
      } else {
        // Initialize settings if they don't exist
        await setDoc(settingsRef, defaultSettings)
      }
    }

    loadSettings()
  }, [user])

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return

    const updatedSettings = { ...settings, ...newSettings }
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences')
    
    await setDoc(settingsRef, updatedSettings, { merge: true })
    setSettings(updatedSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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