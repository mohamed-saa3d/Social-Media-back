# MERN Social Media Backend

## Project Overview
This is the backend service for a social media application built with Node.js, Express, and MongoDB (Mongoose). It provides authentication, authorization, users, posts, comments, notifications, media uploads, and admin endpoints.

## Prerequisites
- Node.js 20+
- npm 10+
- MongoDB instance (Atlas or local)

## Installation
1. Install dependencies:
   - `npm install`
2. Create environment file:
   - Copy `.env.example` to `.env`
   - Fill in your real values

## Environment Variables
See `.env.example` for all required variables.

## Running Locally
- Development: `npm run dev`
- Production: `npm start`

## Running Tests
- `npm test`

## API Overview
Main route groups:
- `/api/users`
- `/api/posts`
- `/api/comments`
- `/api/notifications`
- `/api/media`
- `/api/admin`

Authentication:
- Use `Authorization: Bearer <jwt-token>` for protected routes.

## Deployment Notes
- Set `NODE_ENV=production`
- Provide secure values for `JWT_SECRET` and `MONGO_URI`
- Restrict `ALLOWED_ORIGINS` to trusted client URLs
- Ensure file system permissions for `uploads/` and `logs/`
- Use HTTPS and a reverse proxy in production
----------
## Auth Flow

Register
 ↓
Create User
 ↓
emailVerified = false
 ↓
Generate Email Verification OTP
 ↓
Send Email
 ↓
User enters OTP
 ↓
Verify OTP
 ↓
emailVerified = true
 ↓
Issue Access Token
 ↓
Issue Refresh Token
 ↓
Create Session
 ↓
Auto Login