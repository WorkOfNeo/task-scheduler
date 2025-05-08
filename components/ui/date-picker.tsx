"use client"
import React from "react"
import DatePickerLib from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  id?: string
  selected: Date | null
  onChange: (date: Date | null) => void
  required?: boolean
  className?: string
}

export function DatePicker({ id, selected, onChange, required, className }: DatePickerProps) {
  return (
    <DatePickerLib
      id={id}
      selected={selected}
      onChange={onChange}
      required={required}
      customInput={<Input className={className} />}
      dateFormat="yyyy-MM-dd"
      className={className}
      popperPlacement="bottom-start"
      showPopperArrow={false}
      autoComplete="off"
      placeholderText="Select date"
    />
  )
} 