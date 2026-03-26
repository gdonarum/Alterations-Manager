import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
  return `${formatDate(date)} at ${formatTime(date)}`
}

export function generateTicketNumber() {
  const prefix = 'ALT'
  const date = new Date()
  const dateStr = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${dateStr}-${random}`
}

export const GARMENT_TYPES = [
  'Dress', 'Pants', 'Jeans', 'Skirt', 'Jacket', 'Blazer', 'Shirt', 'Blouse',
  'Wedding Dress', 'Suit', 'Coat', 'Shorts', 'Formal Gown', 'Other'
]

export const ALTERATION_TYPES = [
  'Hem', 'Take in', 'Let out', 'Shorten sleeves', 'Lengthen sleeves',
  'Waist adjustment', 'Zipper repair', 'Zipper replacement', 'Button replacement',
  'Lining repair', 'Patch', 'Taper', 'Alter bodice', 'Other'
]

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: 'Received', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800' },
  picked_up: { label: 'Picked Up', color: 'bg-gray-100 text-gray-800' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
}
