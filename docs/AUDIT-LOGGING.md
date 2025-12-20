# Audit Logging

TIME-SEAL includes comprehensive audit logging to track all seal operations.

## Features

- **Immutable audit trail** for every seal
- **IP tracking** for all access attempts
- **Event types**: Created, Accessed, Unlocked, Denied, Pulse Updated
- **Metadata** for additional context

## Events Tracked

| Event | Description |
|-------|-------------|
| `SEAL_CREATED` | Seal was created |
| `SEAL_ACCESSED` | Seal was accessed (locked or unlocked) |
| `SEAL_UNLOCKED` | Seal was successfully unlocked |
| `SEAL_ACCESS_DENIED` | Access attempt while still locked |
| `PULSE_UPDATED` | Dead man's switch pulse received |

## API Endpoint

```bash
GET /api/audit/{sealId}
```

**Response:**
```json
{
  "sealId": "abc123...",
  "events": [
    {
      "timestamp": 1703001234567,
      "eventType": "SEAL_CREATED",
      "sealId": "abc123...",
      "ip": "192.168.1.1",
      "metadata": {
        "isDMS": true,
        "unlockTime": 1703087634567
      }
    }
  ]
}
```

## Database Schema

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  seal_id TEXT NOT NULL,
  ip TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);
```

## Usage

Audit logs are automatically created for all seal operations. No additional configuration required.
