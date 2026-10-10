# Backroom Housing

A full-stack housing platform built with the MERN stack (MongoDB, Express, React, Node.js), TypeScript, and Tailwind CSS v4.

## Prerequisites
- Node.js (v18+)
- Docker Desktop (must be running prior to starting the development server)

## Local Development Setup
1. **Environment Variables:** Copy `apps/backend/.env.example` to `apps/backend/.env` and ensure the values match your local setup.
2. **Start Database:** Boot up the local MongoDB Docker container.
   ```bash
   npm run db:up