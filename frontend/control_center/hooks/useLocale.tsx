import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Lang } from '@/utils/i18n'

type LocaleContextType = {
  lang: Lang
  toggleLang: () => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('en')

  // Persist language preference
  useEffect(() => {
    const saved = localStorage.getItem('ow-lang') as Lang | null
    if (saved) setLang(saved)
  }, [])

  const toggleLang = () => {
    setLang((l) => {
      const next = l === 'en' ? 'sw' : 'en'
      localStorage.setItem('ow-lang', next)
      return next
    })
  }

  const value = useMemo(() => ({ lang, toggleLang }), [lang])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return ctx
}
