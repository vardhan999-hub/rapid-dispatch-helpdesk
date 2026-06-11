# Live Ops Helpdesk — AI Prompts Log
## Sprint 19: Client Delivery Phase II — Concurrency

### Client: RapidDispatch Freight & Logistics
### Project Code: Live Ops Helpdesk
### Engineer: Tadigadapa Harsha Vardhan

---

## Problem Statement

RapidDispatch Freight & Logistics manages thousands of freight
deliveries daily across Dallas, TX. With 50 active agents working
simultaneously on the same ticket system, their existing CRUD app
caused data corruption through concurrent overwrites. I was assigned
to solve this using WebSockets and real-time concurrency control.

---

## AI Assistance Log

### Prompt 1 — Understanding WebSockets vs Polling

**What I was trying to figure out:**
The sprint forbids setInterval polling. I needed to understand
WHY polling is bad for this use case before I could build the
right solution.

**What I asked:**
"What is the difference between setInterval polling and a
persistent WebSocket connection for real-time updates? When
does each approach break down?"

**What AI explained:**
Polling makes a new HTTP request every few seconds regardless
of whether anything changed — wastes bandwidth and adds latency.
WebSockets keep one persistent TCP connection open. The server
pushes changes the moment they happen. For a helpdesk where
agents need to see locks in under a second, polling would feel
broken.

**What I did with this:**
Built the frontend using Socket.io-client with a singleton
pattern so each browser tab holds exactly one connection.

---

### Prompt 2 — How to Handle the Lock Race Condition

**What I was trying to figure out:**
I realized that if two agents click the same ticket at nearly
the same time, both could emit lock_ticket before either
received confirmation. Both might think they have the lock.

**What I asked:**
"If two clients emit the same socket event at nearly the same
time, how does the server decide which one wins? Is JavaScript
single-threaded enough to prevent this?"

**What AI explained:**
Node.js is single-threaded so event handlers run one at a time
without interruption. The first lock_ticket event to arrive
gets processed completely before the second one starts. This
means checking a Map before setting it is safe in Node.js —
there is no mid-check interruption.

**What I did with this:**
The server checks ticketLocks before granting any lock. First
agent gets the lock. Second agent gets lock_denied with the
first agent's name. This is essentially a mutex using a Map.

---

### Prompt 3 — Atomic Database Updates

**What I was trying to figure out:**
Even with socket locks, I wanted a second layer of protection
at the database. I knew about optimistic locking but was not
sure how to make the version check atomic in Supabase.

**What I asked:**
"In Supabase, if I want to update a row only when the version
column matches a specific value, how do I do that in a single
query without reading first?"

**What AI explained:**
You can chain .eq('version', expectedVersion) onto the update
query. The database only updates the row if both the id AND
the version match. If version changed since the agent opened
the ticket, zero rows update and you can detect the conflict
from an empty result.

**What I did with this:**
Added version checking directly in the PATCH route. If the
result comes back empty, the server returns 409 Conflict and
the frontend shows an error toast.

---

### Prompt 4 — Releasing Locks When Agents Disconnect

**What I was trying to figure out:**
I realized that if an agent closes their browser mid-edit,
their lock would stay in the Map forever. No other agent could
ever edit that ticket again.

**What I asked:**
"In Socket.io, how do I know when a specific client disconnects,
and how do I clean up server-side resources they were holding?"

**What AI explained:**
Socket.io automatically fires a disconnect event on the server
when any client drops — whether the user closed the tab,
lost Wi-Fi, or the browser crashed. Inside the handler you
get access to the socket object of the disconnected client,
so you can scan your Map for their socket.id and clean up.

**What I did with this:**
On disconnect, the server loops through ticketLocks, removes
any entries belonging to that socket.id, and broadcasts
ticket_unlocked for each one. All other agents see affected
tickets re-enable instantly.

---

### Prompt 5 — Fixing the Next.js Hydration Mismatch

**What I was trying to figure out:**
I initially put the localStorage agent name read directly
inside useState but kept getting a hydration warning in
Next.js. The server and client were rendering different values.

**What I asked:**
"Why does reading from localStorage inside useState cause a
hydration error in Next.js, and what is the correct pattern
to fix it?"

**What AI explained:**
Next.js renders components on the server first where
localStorage does not exist. Then it hydrates on the client.
If the server renders one value and the client renders another,
React throws a hydration mismatch. The fix is to start with
an empty string on both server and client, then read
localStorage inside useEffect which only runs on the client
after hydration completes.

**What I did with this:**
Changed agentName to start as an empty string and used
useEffect to read or generate the name from localStorage.
The header shows "Loading..." briefly then switches to the
agent name. No hydration warning.

---

### Prompt 6 — Auto-Assigning the Ticket on Open

**What I was trying to figure out:**
Every ticket showed "Unassigned" even after an agent opened
it. I wanted the system to automatically claim the ticket for
the agent who opens it — but only if nobody else had claimed
it yet.

**What I asked:**
"What is the cleanest way to trigger a side-effect update
when a user opens a record in a React app, without causing
re-render loops?"

**What AI explained:**
Run the update as a fire-and-forget call inside the click
handler after the main action completes. Keep it conditional
so it only fires when the field is still unassigned. Since
the WebSocket broadcasts the update to all clients, everyone
sees the assignment change without any extra UI logic.

**What I did with this:**
Added a conditional updateTicket call inside handleTicketClick
that only fires when assigned_to is Unassigned or empty. The
agent who successfully locks the ticket gets auto-assigned.
All other agents see the update instantly via WebSocket.

---

## Key Engineering Decisions

### In-memory Map for locks instead of database:
Locks are temporary state — they should not survive a server
restart. Storing them in a database would add a round-trip
on every lock and unlock event, slowing down the real-time
feel. The Map gives instant O(1) lookup.

### Singleton socket pattern:
Without a singleton, React's frequent re-renders could create
multiple WebSocket connections from the same tab, resulting
in duplicate events and memory leaks.

### Two layers of concurrency protection:
WebSocket locks prevent the common case. Atomic version checks
catch the edge case where socket events arrive out of order
or the lock check fails under extreme conditions. Defense in
depth.
