# XEVRALIQ — Unified Social Inbox

> Manage every Facebook and Instagram conversation from one place.

XEVRALIQ is a production-ready unified inbox for e-commerce teams. It aggregates messages from multiple Facebook Pages and Instagram accounts into a single real-time dashboard — so your support agents never switch tabs.

---

## Features

- **Real-time inbox** — Webhook-driven message delivery with Server-Sent Events; new messages appear instantly without polling
- **Multi-account** — Connect unlimited Facebook Pages and Instagram Business accounts in one workspace
- **Full conversation history** — All messages, attachments, reactions and delivery receipts synced and stored locally
- **Reply & react** — Send text, images and files; react to messages; automatic 24-hour window fallback with `HUMAN_AGENT` tag
- **Order management** — Create and track customer orders (Pending → Confirmed → Delivered → …) directly inside the conversation
- **Product catalog** — Manage your product list with variants, stock tracking and low-stock alerts
- **Team management** — ADMIN and AGENT roles; invite team members, change roles, remove access
- **Push notifications** — Web push alerts on new incoming messages, even when the tab is closed
- **Offline media** — Attachment files are downloaded and stored locally so they never expire
- **Snooze, star, label** — Full conversation triage tools

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v5 (credentials + JWT) |
| Realtime | Facebook Webhooks + SSE |
| Push | Web Push (VAPID) |
| Testing | Vitest |
| Styling | Tailwind CSS v4 |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A Meta Developer App with Messenger and Instagram permissions
- A public HTTPS URL for the webhook (e.g. Cloudflare Tunnel)

### Installation

```bash
git clone https://github.com/sk-sazzad/XEVRALIQ.git
cd XEVRALIQ
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/unified_inbox"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"

# Meta / Facebook App
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token"

# Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

### Database Setup

```bash
npx prisma migrate deploy
npx prisma db seed          # creates the first admin user
```

### Run

```bash
npm run dev       # development
npm run build     # production build
npm start         # production server
```

---

## Webhook Setup

1. In your Meta App dashboard, set the webhook URL to:
   `https://your-domain.com/api/meta/webhook`
2. Set the verify token to match `META_WEBHOOK_VERIFY_TOKEN`
3. Subscribe to: `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`, `message_reactions`

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # Inbox, Orders, Products, Team, Settings
│   └── api/                  # REST API routes
│       ├── meta/             # Webhook, send, react, sync, OAuth
│       ├── conversations/    # CRUD + search + notes + orders
│       ├── orders/           # Order management
│       ├── products/         # Product catalog
│       └── team/             # User management
├── lib/
│   ├── sync-messages.ts      # Facebook Graph API sync engine
│   ├── download-media.ts     # Attachment caching
│   ├── events.ts             # SSE pub/sub
│   └── push.ts               # Web push notifications
└── components/
    ├── inbox-view.tsx         # Main inbox UI
    ├── sidebar.tsx            # Conversation list
    └── settings-view.tsx      # Account & team settings
prisma/
├── schema.prisma             # Data model
└── migrations/               # Migration history
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run test suite (Vitest) |
| `npm run seed` | Seed the database with an admin user |

---

## License

MIT © [XEVRALIQ](https://github.com/sk-sazzad/XEVRALIQ)
