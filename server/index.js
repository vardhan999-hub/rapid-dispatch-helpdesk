require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://rapid-dispatch-helpdesk.vercel.app',
    ],
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const ticketLocks = new Map()

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'RapidDispatch Live Ops Server running',
  })
})

// Get All Tickets
app.get('/tickets', async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      error: error.message,
    })
  }

  res.json(data)
})

// Create Ticket
app.post('/tickets', async (req, res) => {
  const {
    title,
    description,
    priority,
    customer_name,
  } = req.body

  const ticket_number =
    'TKT-' + String(Date.now()).slice(-5)

  const { data, error } = await supabase
    .from('tickets')
    .insert([
      {
        ticket_number,
        title,
        description,
        priority,
        customer_name,
      },
    ])
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      error: error.message,
    })
  }

  io.emit('ticket_created', data)

  res.json(data)
})

app.patch('/tickets/:id', async (req, res) => {
  const { id } = req.params
  const { version, ...rest } = req.body

  if (version === undefined || version === null) {
    return res.status(400).json({
      error: 'Version is required',
    })
  }

  const currentVersion = Number(version)

  const { data, error } = await supabase
    .from('tickets')
    .update({
      ...rest,
      version: currentVersion + 1,
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      error: error.message,
    })
  }

  if (!data) {
    return res.status(409).json({
      error:
        'Conflict — ticket was updated by another agent',
    })
  }

  io.emit('ticket_updated', data)

  res.json(data)
})

// Socket.IO
io.on('connection', socket => {
  console.log(`Agent connected: ${socket.id}`)

  const locks = {}

  ticketLocks.forEach((value, key) => {
    locks[key] = value
  })

  socket.emit('lock_state', locks)

  socket.on(
    'lock_ticket',
    ({ ticketId, agentName }) => {
      const existingLock =
        ticketLocks.get(ticketId)

      if (
        existingLock &&
        existingLock.agentId !== socket.id
      ) {
        socket.emit('lock_denied', {
          ticketId,
          lockedBy: existingLock.agentName,
        })
        return
      }

      ticketLocks.set(ticketId, {
        agentId: socket.id,
        agentName,
      })

      io.emit('ticket_locked', {
        ticketId,
        agentId: socket.id,
        agentName,
      })
    }
  )

  socket.on('unlock_ticket', ({ ticketId }) => {
    ticketLocks.delete(ticketId)

    io.emit('ticket_unlocked', {
      ticketId,
    })
  })

  socket.on('disconnect', () => {
    console.log(
      `Agent disconnected: ${socket.id}`
    )

    const releasedTickets = []

    ticketLocks.forEach((value, key) => {
      if (value.agentId === socket.id) {
        ticketLocks.delete(key)
        releasedTickets.push(key)
      }
    })

    releasedTickets.forEach(ticketId => {
      io.emit('ticket_unlocked', {
        ticketId,
      })
    })
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  )
})