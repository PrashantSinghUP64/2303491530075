# Stage 1

## REST API Design for Notification Platform

### POST /api/notifications
Create a new notification

**Request Body:**
```json
{
  "studentId": "string",
  "type": "Placement | Event | Result",
  "message": "string",
  "title": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "studentId": "string",
  "type": "string",
  "message": "string",
  "isRead": false,
  "createdAt": "timestamp"
}
```

### GET /api/notifications/:studentId
Get all notifications for a student

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "string",
      "isRead": false,
      "createdAt": "timestamp"
    }
  ]
}
```

### PATCH /api/notifications/:id/read
Mark notification as read

### DELETE /api/notifications/:id
Delete a notification

## Real-time Notification Mechanism
Using WebSockets (Socket.io):
- Student connects with their studentId
- Server pushes notification instantly on new event
- Fallback to polling every 30 seconds if WebSocket fails

---

# Stage 2

## Database: PostgreSQL

### Reasoning:
- Structured data with clear relationships
- ACID compliance for reliable delivery
- Better for complex queries on notifications

### Schema:
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  type VARCHAR(50) CHECK (type IN ('Placement', 'Event', 'Result')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Scaling Problems & Solutions:
- **Problem:** 50,000 students = millions of rows
- **Solution:** Add index on student_id and created_at
- **Partitioning:** Partition table by month

---

# Stage 3

## Query Analysis:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Why is it slow?
- No index on studentID or isRead
- SELECT * fetches unnecessary columns
- 5 million rows = full table scan

### Fix:
```sql
CREATE INDEX idx_notifications_student_read 
ON notifications(studentID, isRead, createdAt);

-- Optimized query:
SELECT id, message, type, createdAt 
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Indexing every column - Bad idea?
YES - bad idea because:
- Write operations become slow
- Extra storage used
- Only index columns used in WHERE/ORDER BY

### Placement notifications last 7 days:
```sql
SELECT * FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

---

# Stage 4

## Performance Solution: Caching with Redis

### Strategy:
1. First request -> fetch from DB -> store in Redis (TTL: 5 min)
2. Next requests -> serve from Redis directly
3. When new notification arrives -> invalidate cache

### Tradeoffs:
- **Pro:** 10x faster response
- **Con:** Slight data staleness (max 5 min old data)

### Other options:
- **Pagination:** Load 20 notifications at a time
- **Lazy loading:** Load more on scroll

---

# Stage 5

## Problem with current implementation:
- Sequential loop - if email fails at student 200, remaining 49,800 don't get notified
- No retry mechanism
- Slow - one by one processing

## Solution: Queue based system

```javascript
// Revised pseudocode
async function notify_all(student_ids, message) {
  // Save to DB first (independent of email)
  await save_all_to_db(student_ids, message);
  
  // Add to queue - process in batches
  const batches = chunk(student_ids, 100);
  for (const batch of batches) {
    await queue.add('send-emails', { batch, message });
  }
}
```

### DB save and Email - together or separate?
**Separate** - because:
- DB save should never fail due to email service being down
- Email can be retried, DB record should exist immediately

---

# Stage 6

## Priority Inbox Implementation

### Priority Scoring Algorithm
Each notification is scored using a combination of:
1. **Type Weight** — Placement (3) > Result (2) > Event (1)
2. **Recency** — More recent notifications score higher (Unix timestamp in ms)

```
priorityScore = typeWeight * 1,000,000 + timestamp_ms
```

This ensures type always takes precedence, and within the same type, newer notifications come first.

### Implementation (JavaScript — notification_app_be/index.js)
```javascript
function getPriorityScore(notification) {
  const typeWeight = { "Placement": 3, "Result": 2, "Event": 1 };
  const weight = typeWeight[notification.Type] || 1;
  const recency = new Date(notification.Timestamp).getTime();
  return weight * 1000000 + recency;
}

// GET /priority?n=10
// Fetches from live API, sorts by score, returns top n
```

### API Endpoint
```
GET http://localhost:3001/priority?n=10
```

### Maintaining Top-N Efficiently as New Notifications Arrive
**Problem:** New notifications keep coming in, naively re-sorting all notifications is O(n log n).

**Solution — Min-Heap (Priority Queue):**
- Maintain a min-heap of size `n`
- For each new notification, compute its score
- If score > heap's minimum → evict the minimum, insert the new one
- This keeps the top-n updated in **O(log n)** per new notification

```javascript
// Pseudocode using a min-heap of size n
function maintainTopN(heap, newNotification, n) {
  const score = getPriorityScore(newNotification);
  if (heap.size < n) {
    heap.push({ score, notification: newNotification });
  } else if (score > heap.peekMin().score) {
    heap.popMin();
    heap.push({ score, notification: newNotification });
  }
  // heap always contains the top-n notifications
}
```

### Screenshots
See `/screenshots/` folder in this repository for Postman output showing top 10 priority notifications.
