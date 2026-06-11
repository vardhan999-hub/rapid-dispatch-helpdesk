'use client'
import { useState } from 'react'
import { X, Lock } from 'lucide-react'
import { Ticket, TicketStatus } from '@/types/ticket'

interface TicketDetailModalProps {
  ticket: Ticket
  isLocked: boolean
  lockedBy: string
  onClose: () => void
  onSave: (id: string, updates: Partial<Ticket>) => Promise<void>
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export default function TicketDetailModal({
  ticket,
  isLocked,
  lockedBy,
  onClose,
  onSave,
}: TicketDetailModalProps) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(ticket.id, {
      status,
      assigned_to: assignedTo,
      version: ticket.version,
    })
    setSaving(false)
    onClose()
  }

  const priorityColor = {
    high: 'bg-red-100 text-red-600',
    medium: 'bg-amber-100 text-amber-600',
    low: 'bg-emerald-100 text-emerald-600',
  }[ticket.priority]

  return (
    <>
      <div
        onClick={!isLocked ? onClose : undefined}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[90vw] max-w-lg p-7">

        {isLocked && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
            <Lock size={15} className="text-amber-500" />
            <span className="text-sm text-amber-700 font-medium">
              🔒 Locked by {lockedBy} — View only
            </span>
          </div>
        )}

        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">
                {ticket.ticket_number}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColor}`}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {ticket.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer: {ticket.customer_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {ticket.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TicketStatus)}
              disabled={isLocked}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white focus:border-indigo-400 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Assigned To
            </label>
            <input
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              disabled={isLocked}
              placeholder="Agent name"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors bg-white cursor-pointer"
          >
            Close
          </button>
          {!isLocked && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors border-none cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}