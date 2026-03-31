'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Settings {
  appName: string
  darkMode: boolean
  timezone: string
  [key: string]: any
}

interface SettingsContextType {
  settings: Settings
  loading: boolean
  refreshSettings: () => Promise<void>
}

const defaultSettings: Settings = {
  appName: '', // Bo'sh bo'lsa, yuklanguncha hech narsa ko'rinmaydi va "flash" bo'lmaydi
  darkMode: true,
  timezone: 'Asia/Tashkent',
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const parsedSettings: Settings = { ...defaultSettings }
        
        Object.entries(data).forEach(([k, v]) => {
          parsedSettings[k] = v === 'true' ? true : v === 'false' ? false : v
        })
        
        setSettings(parsedSettings)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const refreshSettings = async () => {
    await loadSettings()
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
