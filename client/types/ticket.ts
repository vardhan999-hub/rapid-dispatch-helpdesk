export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  customer_name: string
  assigned_to: string
  locked_by: string | null
  locked_at: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface LockInfo {
  agentId: string
  agentName: string
}

export interface LockState {
  [ticketId: string]: LockInfo
}