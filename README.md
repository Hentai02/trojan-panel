# Trojan Panel

Web-based administration panel for managing a [Trojan](https://github.com/trojan-gfw/trojan) proxy server.

## Features

- **User Management** — CRUD interface for proxy user accounts with bandwidth quota tracking
- **Usage Monitoring** — Color-coded progress bars show quota consumption per user (green < 80%, yellow 80-99%, red ≥ 100%)
- **Unlimited Quota** — Set quota to `-1` for users with no bandwidth limit
- **Service Logs** — View `trojan.service` journal output with auto-refresh
- **Config Editor** — Edit `/etc/trojan/config.json` through a structured form and restart the service
- **Service Status** — Monitor service state, PID, uptime, CPU%, and memory usage
- **Authentication** — Login page with bcrypt password hashing and brute-force rate limiting

## Prerequisites

- Node.js ≥ 18
- MySQL (default port 3307)
- Trojan proxy server installed with `systemd` service `trojan.service`
- Linux environment (for `journalctl` and `systemctl` commands)

## Setup

```bash
# Install dependencies
npm install

# Initialize the database and table
node setup.js

# (Optional) Seed with test users
node seed.js

# Start the server
npm start
```

The panel runs on `http://localhost:3000` by default.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `ADMIN_USER` | `admin` | Admin panel username |
| `ADMIN_PASS` | `admin` | Admin panel password |
| `CORS_ORIGIN` | — | Allowed CORS origin |
| `SESSION_SECRET` | auto-generated | Session encryption secret |

## Database

The application uses a MySQL database named `trojan` with a `users` table:

| Column | Type | Description |
|---|---|---|
| `id` | INT UNSIGNED | Primary key |
| `username` | VARCHAR(64) | Proxy username |
| `password` | CHAR(56) | SHA-224 hashed password |
| `quota` | BIGINT | Bandwidth quota in bytes (-1 = unlimited) |
| `download` | BIGINT UNSIGNED | Downloaded bytes |
| `upload` | BIGINT UNSIGNED | Uploaded bytes |

## Quota Logic

Trojan grants a connection when `download + upload < quota`. A negative quota value enables unlimited bandwidth.

## License

ISC
