'use client'
import { Lock } from 'lucide-react'
import { Ticket, LockInfo } from '@/types/ticket'

interface TicketRowProps {
  ticket: Ticket
  lockInfo: LockInfo | null
  isOwnLock: boolean
  onClick: () => void
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-emerald-100 text-emerald-600',
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-600',
  in_progress: 'bg-indigo-100 text-indigo-600',
  resolved: 'bg-emerald-100 text-emerald-600',
  closed: 'bg-slate-100 text-slate-500',
}

export default function TicketRow({
  ticket,
  lockInfo,
  isOwnLock,
  onClick,
}: TicketRowProps) {
  const isLocked = !!lockInfo && !isOwnLock

  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-100 cursor-pointer transition-all ${
        isLocked
          ? 'bg-slate-100 opacity-60'
          : 'hover:bg-indigo-50/40 bg-white'
      }`}
    >
      <td className="px-4 py-3 font-mono text-xs text-slate-400">
        {ticket.ticket_number}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isLocked && (
            <Lock size={13} className="text-amber-500 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
              {ticket.title}
            </p>
            {isLocked && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                🔒 Locked by {lockInfo.agentName}
              </p>
            )}
            {isOwnLock && (
              <p className="text-xs text-indigo-500 font-medium mt-0.5">
                ✏️ You are editing
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {ticket.customer_name}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[ticket.priority] || 'bg-slate-100 text-slate-500'}`}>
          {ticket.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[ticket.status] || 'bg-slate-100 text-slate-500'}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {ticket.assigned_to}
      </td>
    </tr>
  )
}