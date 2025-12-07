## JIIT Campus Updates

![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?logo=nextdotjs&logoColor=white) ![Node](https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white) ![Python](https://img.shields.io/badge/Backend-Python-3776AB?logo=python&logoColor=white) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white) ![LangChain](https://img.shields.io/badge/AI-LangChain-1C3C3C)

JIIT Campus Updates is a web application that aggregates placement notices, job listings, and campus updates and delivers curated notifications via a Telegram bot. The project consists of:

- A Next.js frontend (in `campus-updates/`) that serves the web UI and a few server API routes.
- A Python-based backend bot (in `backend/placement_updates/`) which scrapes sources, formats notices using LangChain/LangGraph + Google Generative API, persists data to MongoDB, and broadcasts updates to Telegram.

This README documents how to run the frontend and the Python bot, what environment variables are required, and how the scheduling works.

## Analytics (sed it got shut yet visitors lol)
![2025-12-08_02 09 51 copy](https://github.com/user-attachments/assets/af523024-0611-405e-907d-12ef36d93b34)

## Quick status

- Frontend: Next.js app located in `campus-updates/` (use `pnpm`/`npm`/`yarn` as you prefer; a `pnpm-lock.yaml` is present).
- Backend: Python scripts in `backend/placement_updates/` (not a FastAPI web service). The bot runs scheduled scraping and Telegram broadcast jobs.

## Features

- Aggregates placement and campus notices from configured sources
- Formats notices using an LLM workflow (LangChain + LangGraph + Google Generative AI)
- Persists structured notices and job listings to MongoDB
- Broadcasts updates to a Telegram channel via a Telegram Bot
- Supports running as a foreground process or detached daemon (background)

## Requirements

- Node.js (for frontend) and a package manager (pnpm, npm, or yarn)
- Python 3.10+ (for the backend bot)
- MongoDB instance (cloud or local)
- Google Generative API key (if you want the LLM-based formatting to work)

## Environment variables

The project expects a few environment variables. Place them in `.env` files or export them in your environment.

- Common / Database

  - MONGODB_URI - MongoDB connection string (required by both frontend server APIs and backend bot)
  - MONGODB_DB - optional, database name (defaults to `SupersetPlacement`)

- Backend (Python bot) — set in `backend/placement_updates/.env` or your shell

  - TELEGRAM_BOT_TOKEN - Telegram bot token (example env in repo: `TELEGRAM_BOT_TOKEN`)
  - TELEGRAM_CHAT_ID - target Telegram chat id for broadcast (example env in repo: `TELEGRAM_CHAT_ID`)
  - GOOGLE_API_KEY - Google Generative API key used by the notice formatter (optional if you don't need LLM formatting)

- Frontend (optional / analytics)
  - NEXT_PUBLIC_POSTHOG_KEY - PostHog key used in frontend (optional)
  - NEXT_PUBLIC_POSTHOG_HOST - PostHog host (optional)

Note: The repository currently contains an example `backend/placement_updates/.env` and `campus-updates/.env` with values; remove or rotate any secrets before publishing.

## Running locally

1. Frontend (development)

```bash
cd campus-updates
# Install deps (pnpm recommended because a pnpm-lock.yaml exists, but npm/yarn will also work)
pnpm install
pnpm dev
# or: npm install && npm run dev
```

Open http://localhost:3000 to view the frontend.

2. Backend bot (development / run-once)

```bash
cd backend/placement_updates
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Run the bot once (scrape + send to Telegram)
python main.py
```

3. Bot server with scheduler

The code includes `bot_server.py` which starts the Telegram bot server and a scheduler that runs scraping + broadcasting at multiple times per day.

```bash
cd backend/placement_updates
source .venv/bin/activate
python bot_server.py     # accepts -d / --daemon to spawn a background process
python bot_server.py --daemon
```

Daemon mode: when run with `--daemon` the process is detached and logs are written to `backend/placement_updates/logs/superset_bot.log`.

4. Run Telegram-only sending (no scraping)

```bash
cd backend/placement_updates
python main.py --telegram-only
```

## Scheduler times

The backend scheduler (in `bot_server.py`) registers jobs to run multiple times per day (IST):

- 09:00 IST
- 12:00 IST
- 15:00 IST
- 18:00 IST
- 20:00 IST
- 00:00 IST

These times are defined in `bot_server.py` and can be adjusted in the source if you need a different cadence.

## Logs

- When running in daemon mode, logs are written to `backend/placement_updates/logs/superset_bot.log`.
- When running in foreground, output is printed to the console.

## Notes and TODOs

- The backend uses LangChain / LangGraph and the Google Generative API to format notices. If you don't set `GOOGLE_API_KEY`, the formatting will fall back to simpler logic (check `notice_formater.py`).
- The repo contains sensitive credentials in `campus-updates/.env` and `backend/placement_updates/.env`. Rotate or remove them before making the repo public.

## Project layout (high level)

```
.
├── backend/placement_updates/     # Python bot: scraping, formatting, DB, Telegram
│   ├── main.py                    # Orchestrator (run once / telegram-only)
│   ├── bot_server.py              # Bot server + scheduler (daemon support)
│   ├── telegram_handeller.py      # Telegram bot implementation
│   ├── notice_formater.py         # LLM formatter (LangChain/LangGraph + Google GenAI)
│   ├── database.py                # MongoDB helpers
│   ├── update.py                  # Scraper + upsert logic
│   └── requirements.txt

├── campus-updates/                # Next.js frontend app
│   ├── app/
│   ├── components/
│   └── package.json
│
└── README.md
```

## Contributing

Contributions welcome. If you add functionality, include tests where possible and avoid committing secrets. For large changes, open an issue first to discuss.

## License

This project is licensed under MIT. See the `LICENSE` file for details.
