# Britizen Quiz Application Add-on for Home Assistant

A comprehensive quiz application with 102 Life in the UK practice tests, running natively on Home Assistant OS.

## Installation

1. In Home Assistant, go to **Settings** → **Add-ons & Backups** → **Add-on Store**
2. Click the menu (⋮) and select **Repositories**
3. Add: `https://github.com/chanchurbansal/lit-uk`
4. Install "Britizen Quiz Application"
5. Click **Start**
6. Open the Web UI: `http://homeassistant.local:3000`

## Features

- **102 Life in the UK Practice Tests** - Complete official test coverage
- **User Progress Tracking** - Automatic tracking of quiz attempts and scores
- **Score History** - View all previous attempts and results
- **Server-Side Database** - SQLite database for persistent data storage
- **Responsive Design** - Works on desktop, tablet, and mobile
- **No Configuration Needed** - Works out of the box

## Data Storage

Quiz data is stored in `/config/britizen-quiz/quiz_database.db` and automatically included in Home Assistant backups.

## Supported Platforms

- Raspberry Pi 2 (armhf)
- Raspberry Pi 3 (armv7)
- Raspberry Pi 4 (aarch64)
- Generic x86_64 systems

