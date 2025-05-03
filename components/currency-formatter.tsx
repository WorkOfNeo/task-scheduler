"use client"

import { useSettings } from "@/lib/settings-context"

interface CurrencyFormatterProps {
  amount: number
  className?: string
}

export function CurrencyFormatter({ amount, className }: CurrencyFormatterProps) {
  const { settings } = useSettings()
  const { currency } = settings

  const formattedAmount = new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return (
    <span className={className}>
      {currency.position === 'before' ? (
        <>
          {currency.symbol}
          {formattedAmount}
        </>
      ) : (
        <>
          {formattedAmount}
          {currency.symbol}
        </>
      )}
    </span>
  )
} 