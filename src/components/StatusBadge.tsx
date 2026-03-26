import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/lib/utils'

export default function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', info.color)}>
      {info.label}
    </span>
  )
}
