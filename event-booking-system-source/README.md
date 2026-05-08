## Overview
This is the codebase for the Event Booking System.

It includes:
- Backend (Node.js + Express API)
- Frontend (React + Vite)
- MySQL database schema

## Requirements

- Node.js (v16+)
- MySQL

## Project Structure

event-booking-system/
├── updated_backend/     # Express backend (API + DB logic)
├── updated_frontend/    # React frontend (UI)
└── eb_database.sql      # Database (for local testing)

## Backend Setup
    Ensure `.env` is configured before starting the backend

    cd updated_backend
    npm install

    Copy `.env.example` → `.env` and update values

    Run the server:
    node src/server.js
    
    Server runs at:
    http://localhost:3000

## Frontend Setup
    Ensure frontend is configured to call backend at:
    http://localhost:3000

    Inside `updated_frontend/.env`:
    VITE_API_BASE_URL=http://localhost:3000

    For production:
    VITE_API_BASE_URL=http://<your-alb-url>

    cd updated_frontend
    npm install

    Run locally:
    npm run dev

    Build:
    npm run build

## Database Setup

Import the database:

1. Open MySQL Workbench
2. Import `eb_database.sql`
3. Ensure DB details matches `.env`

## Core API Endpoints

GET /events
GET /events/:id
POST /bookings

POST /admin/events
PUT /admin/events/:id
DELETE /admin/events/:id
GET /admin/bookings
PATCH /admin/bookings/:id/status

## Notes

- Ensure MySQL is running before backend
- Update `.env` correctly
- Backend must run before frontend API calls
- Core booking works without AI features
- Do not commit `.env` file (contains sensitive keys)

## Optional Features

The project includes additional features like:
- AI-based event improvement
- File uploads (images/PDFs)

These are optional and do not affect core booking functionality.