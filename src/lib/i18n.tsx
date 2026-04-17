'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../../messages/en.json'
import ar from '../../messages/ar.json'

type Locale = 'en' | 'ar'
type Messages = typeof en

const messages: Record<Locale, Messages> = { en, ar: ar as Messages }

interface I18nContextType {
  locale: Locale
  t: (key: keyof Messages) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: (key) => String(en[key] ?? key),
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored === 'ar' || stored === 'en') {
      setLocaleState(stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem('locale', next)
  }

  const t = (key: keyof Messages): string =>
    String(messages[locale][key] ?? messages.en[key] ?? key)

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
