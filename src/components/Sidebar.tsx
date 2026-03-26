'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  DollarSign,
  Bot,
  Scissors,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logOut } = useAuth()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Scissors className="text-purple-600" size={24} />
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Alterations</h1>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        {user && (
          <div className="flex items-center gap-2 mb-2">
            {user.photoURL && <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />}
            <span className="text-xs text-gray-600 truncate">{user.displayName || user.email}</span>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center">Hours: 9am – 9pm daily</p>
        <button onClick={logOut} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  )
}
