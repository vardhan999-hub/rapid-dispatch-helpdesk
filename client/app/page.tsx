'use client'
import { useState, useEffect } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { Ticket } from '@/types/ticket'
import TicketRow from '@/components/TicketRow'
import TicketDetailModal from '@/components/TicketDetailModal'
import CreateTicketModal from '@/components/CreateTicketModal'
import ConnectionBanner from '@/components/ConnectionBanner'
import { Plus, Radio, Ticket as TicketIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function HomePage() {
  const {
    tickets,
    locks,
    connected,
    loading,
    agentName,
    lockTicket,
    unlockTicket,
    createTicket,
    updateTicket,
  } = useTickets()

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [socketId, setSocketId] = useState('')

  useEffect(() => {
    import('@/lib/socket').then(({ getSocket }) => {
      const s = getSocket()
      if (s.id) setSocketId(s.id)
      s.on('connect', () => setSocketId(s.id || ''))
    })
  }, [])

  const handleTicketClick = (ticket: Ticket) => {
    const lockInfo = locks[ticket.id]

    if (lockInfo && lockInfo.agentId !== socketId) {
      setSelectedTicket(ticket)
      toast.warning(`This ticket is locked by ${lockInfo.agentName}`)
      return
    }

    lockTicket(ticket.id)

if (
  ticket.assigned_to === 'Unassigned' ||
  !ticket.assigned_to
) {
  updateTicket(ticket.id, {
    assigned_to: agentName,
    version: ticket.version,
  })
}

setSelectedTicket(ticket)
  }

  const handleClose = () => {
    if (selectedTicket) {
      unlockTicket(selectedTicket.id)
    }
    setSelectedTicket(null)
  }

  const handleSave = async (id: string, updates: Partial<Ticket>) => {
    const res = await updateTicket(id, updates)
    if (res?.error) {
      toast.error('Save failed — ticket was updated by another agent')
      return
    }
    unlockTicket(id)
    toast.success('Ticket updated successfully')
  }

  const handleCreate = async (data: any) => {
    await createTicket(data)
    toast.success('Ticket created — all agents notified!')
  }

  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length

  return (
    <div className="min-h-screen bg-slate-50">
      <ConnectionBanner connected={connected} />

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <TicketIcon size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Live Ops Helpdesk
              </h1>
              <p className="text-xs text-slate-400">
                RapidDispatch Freight & Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-slate-500">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
             {agentName || 'Loading...'}
             </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors border-none cursor-pointer"
            >
              <Plus size={15} />
              New Ticket
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="max-w-screen-xl mx-auto px-6 py-5 space-y-5">

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', value: tickets.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Open', value: openCount, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'In Progress', value: inProgressCount, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Resolved', value: resolvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* TICKET TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={15} className="text-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-800">
                Active Support Queue
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {tickets.length} tickets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Ticket #', 'Issue', 'Customer', 'Priority', 'Status', 'Assigned To'].map(h => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : tickets.map(ticket => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    lockInfo={locks[ticket.id] || null}
                    isOwnLock={locks[ticket.id]?.agentId === socketId}
                    onClick={() => handleTicketClick(ticket)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          isLocked={
            !!locks[selectedTicket.id] &&
            locks[selectedTicket.id].agentId !== socketId
          }
          lockedBy={locks[selectedTicket.id]?.agentName || ''}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}