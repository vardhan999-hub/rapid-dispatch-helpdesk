# Live Ops Helpdesk — RapidDispatch

## Project Overview

Live Ops Helpdesk is a real-time support ticket management system built for RapidDispatch Freight & Logistics. The application enables multiple support agents to manage freight support tickets simultaneously while preventing concurrent edits through WebSocket-based ticket locking and optimistic concurrency control.

---

## Live Demo
[View Live Application](https://rapid-dispatch-helpdesk-rouge.vercel.app)

---

## GitHub Repository

[View Source Code](https://github.com/vardhan999-hub/rapid-dispatch-helpdesk)
---

## Business Problem

RapidDispatch Freight & Logistics manages thousands of freight deliveries daily. When a truck breaks down, a shipment is delayed, or a delivery fails, support tickets are generated for agents to resolve.

In the client's previous system, multiple agents could open and edit the same ticket simultaneously. This created race conditions where one agent's changes could overwrite another agent's work, leading to inconsistent ticket data, duplicate actions, and reduced operational efficiency.

The objective was to build a real-time collaborative helpdesk that prevents concurrent editing while keeping all connected agents synchronized instantly.

---

## Solution

The application uses Socket.IO to maintain persistent real-time communication between clients and the server.

When an agent opens a ticket:

* The ticket is immediately locked.
* Other agents see the lock instantly.
* Editing controls become unavailable for everyone except the lock owner.
* Changes are synchronized in real time.
* Locks are automatically released when the ticket is closed, saved, or the agent disconnects.

---

## Track

Frontend Specialist — Track A

---

## Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* Socket.IO Client
* Sonner
* Vercel

### Backend

* Node.js
* Express.js
* Socket.IO
* Supabase PostgreSQL
* Render

---

## Core Features

### Real-Time Ticket Dashboard

* Displays active support tickets
* Real-time synchronization across all connected clients
* New tickets appear instantly without page refresh
* KPI dashboard displaying ticket statistics
* Skeleton loading states during data fetch

### Ticket Locking System

* Clicking a ticket emits a `lock_ticket` event
* Ticket instantly locks across all connected sessions
* Locked tickets display visual indicators
* Editing is restricted to the lock owner
* Agent identity persists using localStorage

### Automatic Lock Release

* Saving a ticket releases the lock
* Closing a ticket releases the lock
* Browser disconnects automatically release locks
* Prevents stale locks from blocking other agents

### Concurrency Protection

* Server-side lock validation
* Lock denial events for conflicting access attempts
* Version-based optimistic locking
* HTTP 409 Conflict responses for stale updates
* User-friendly conflict notifications

### Connection Recovery

* WebSocket disconnect detection
* Reconnection attempts
* User notifications when connection is lost
* Graceful degradation during outages

---

## System Architecture

```text
Browser Client (Next.js)
        │
        ▼
Socket.IO Connection
        │
        ▼
Express + Socket.IO Server
        │
        ▼
In-Memory Lock Manager
        │
        ▼
Supabase PostgreSQL
```

---

## Ticket Lock Flow

```text
Agent opens ticket
        │
        ▼
Frontend emits lock_ticket
        │
        ▼
Server checks lock map
        │
        ├── Available
        │       ▼
        │   Create lock
        │       ▼
        │   Broadcast ticket_locked
        │
        └── Already Locked
                ▼
            Emit lock_denied
```

---

## Disconnect Recovery Flow

```text
Agent disconnects
        │
        ▼
Socket.IO disconnect event
        │
        ▼
Server scans lock map
        │
        ▼
Remove owned locks
        │
        ▼
Broadcast ticket_unlocked
```

---

## Optimistic Locking Strategy

WebSocket ticket locking prevents normal concurrent editing scenarios.

As an additional safeguard, every ticket contains a version number. Updates only succeed when the submitted version matches the current database version.

This protects against stale writes and unexpected concurrency situations by ensuring outdated data cannot overwrite newer changes.

---

## Database Schema

```sql
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,

  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),

  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high')),

  customer_name text NOT NULL,
  assigned_to text DEFAULT 'Unassigned',

  locked_by text,
  locked_at timestamptz,

  version integer DEFAULT 1,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Project Structure

```text
rapid-dispatch-helpdesk/
├── client/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   └── types/
│
├── server/
│   ├── index.js
│   └── package.json
│
├── README.md
└── prompts.md
```

---

## Local Setup

### Backend

```bash
cd server
npm install
node index.js
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Application URL:

```text
http://localhost:3000
```

---

## Environment Variables

### Client (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

### Server (.env)

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Deployment

Frontend:

* Vercel

Backend:

* Render

Database:

* Supabase PostgreSQL

---

## AI Transparency

AI assistance used during development has been documented in:

```text
prompts.md
```

The document includes architectural discussions, debugging assistance, concurrency design decisions, WebSocket implementation concepts, and deployment troubleshooting.

---

## Sprint Information

Sprint 19 — Client Delivery Phase II (Concurrency)

Prodesk IT Internship Program

---

## Engineer

Tadigadapa Harsha Vardhan

Frontend Intern — Prodesk IT

GitHub:
https://github.com/vardhan999-hub

LinkedIn:
https://linkedin.com/in/harshatadigadapa
