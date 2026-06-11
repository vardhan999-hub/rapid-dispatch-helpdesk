import { useEffect, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { Ticket, LockState } from '@/types/ticket'
import { toast } from 'sonner'

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [locks, setLocks] = useState<LockState>({})
  const [connected, setConnected] = useState(true)
  const [loading, setLoading] = useState(true)

  // FIXED: prevents hydration mismatch
  const [agentName, setAgentName] = useState('')

  useEffect(() => {
    let name = localStorage.getItem('agent-name')

    if (!name) {
      name =
        'Agent ' +
        Math.random().toString(36).slice(2, 6).toUpperCase()

      localStorage.setItem('agent-name', name)
    }

    setAgentName(name)
  }, [])

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER}/tickets`)
      const data = await res.json()
      setTickets(data)
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
    const socket = getSocket()

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('lock_state', (serverLocks: LockState) => {
      setLocks(serverLocks)
    })

    socket.on('ticket_created', (ticket: Ticket) => {
      setTickets(prev => [ticket, ...prev])
    })

    socket.on('ticket_updated', (updated: Ticket) => {
      setTickets(prev =>
        prev.map(t => (t.id === updated.id ? updated : t))
      )
    })

    socket.on(
      'ticket_locked',
      ({ ticketId, agentName: lockedBy, agentId }) => {
        setLocks(prev => ({
          ...prev,
          [ticketId]: { agentId, agentName: lockedBy },
        }))
      }
    )

    socket.on(
      'ticket_unlocked',
      ({ ticketId }: { ticketId: string }) => {
        setLocks(prev => {
          const updated = { ...prev }
          delete updated[ticketId]
          return updated
        })
      }
    )

    socket.on(
      'lock_denied',
      ({ lockedBy }: { lockedBy: string }) => {
        toast.error(`Ticket already locked by ${lockedBy}`)
      }
    )

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('lock_state')
      socket.off('ticket_created')
      socket.off('ticket_updated')
      socket.off('ticket_locked')
      socket.off('ticket_unlocked')
      socket.off('lock_denied')
    }
  }, [loadTickets])

  const lockTicket = useCallback(
    (ticketId: string) => {
      const socket = getSocket()
      socket.emit('lock_ticket', { ticketId, agentName })
    },
    [agentName]
  )

  const unlockTicket = useCallback((ticketId: string) => {
    const socket = getSocket()
    socket.emit('unlock_ticket', { ticketId })
  }, [])

  const createTicket = useCallback(
    async (data: {
      title: string
      description: string
      priority: string
      customer_name: string
    }) => {
      await fetch(`${SERVER}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    []
  )

  const updateTicket = useCallback(
    async (id: string, updates: Partial<Ticket>) => {
      const res = await fetch(`${SERVER}/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      return res.json()
    },
    []
  )

  return {
    tickets,
    locks,
    connected,
    loading,
    agentName,
    lockTicket,
    unlockTicket,
    createTicket,
    updateTicket,
  }
}