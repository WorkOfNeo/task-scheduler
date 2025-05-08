"use client"

import { useSettings } from "@/lib/settings-context"

interface CurrencyFormatterProps {
  amount: number
  currency?: string
}

export function CurrencyFormatter({ amount, currency }: CurrencyFormatterProps) {
  const { settings } = useSettings()
  const defaultCurrency = settings.currency?.code || "EUR"
  const displayCurrency = currency || defaultCurrency

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: displayCurrency,
  }).format(amount);
} 