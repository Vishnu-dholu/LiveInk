# Real-Time Drawing App

## Overview

This is a real-time collaborative drawing application built using **React (Vite) + Konva.js** for the frontend and **Express.js + WebSockets + PostgreSQL** for the backend. The app allows users to draw, use different tools, and collaborate in real time.

## Tech Stack

- **Frontend**: React (Vite), Konva.js, Tailwind CSS
- **Backend**: Express.js, WebSockets (Socket.IO), PostgreSQL
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose

## Project Structure

```
/real-time-drawing-app
├── /backend # Backend (Express.js + PostgreSQL + WebSockets)
│   ├── /config # Configuration files
│   │   ├── db.js # PostgreSQL connection (ES6 modules)
│   ├── /routes # API routes
│   │   ├── drawings.js # Routes for saving & fetching drawings
│   ├── /controllers # Business logic for routes
│   │   ├── drawingController.js # Handles drawing save/load logic
│   ├── /middleware # Middleware functions (auth, validation)
│   ├── /utils # Utility functions (helper functions)
│   ├── server.js # Main Express server with WebSockets
│   ├── package.json # Backend dependencies
│   ├── Dockerfile # Docker setup for backend
│   ├── .env # Environment variables (DB, JWT secrets)
│
├── /frontend # Frontend (React + Vite + Konva.js)
│   ├── /src
│   │   ├── /components # Reusable React components
│   │   │   ├── Canvas.js # Konva.js drawing canvas
│   │   │   ├── Toolbar.js # UI controls (undo, redo, color picker)
│   │   │   ├── Shapes.js # Shape tools (rectangle, circle, line)
│   │   ├── /utils # Utility functions for frontend
│   │   ├── App.js # Main React component
│   │   ├── index.js # Entry point
│   ├── vite.config.js # Vite configuration
│   ├── package.json # Frontend dependencies
│   ├── Dockerfile # Docker setup for frontend
│
├── /database # Database initialization scripts
│   ├── init.sql # PostgreSQL table creation script
│
├── /docker # Docker & deployment configs
│   ├── docker-compose.yml # Docker Compose for backend, frontend & DB
│
├── .gitignore # Ignore unnecessary files
├── README.md # Project documentation
```

## Getting Started

### Prerequisites

- Node.js
- Docker & Docker Compose
- PostgreSQL

### Installation & Running Locally

#### 1️⃣ Clone the repository:

```bash
git clone https://github.com/your-username/real-time-drawing-app.git
cd real-time-drawing-app
```

#### 2️⃣ Set up environment variables

Create a `.env` file inside the `backend/` directory with the following:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_secret_key
```

#### 3️⃣ Start the backend & database using Docker

```bash
docker-compose up --build
```

#### 4️⃣ Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### Features

- 🎨 **Real-time drawing** using WebSockets
- 🖌️ **Multiple tools** (brush, shapes, eraser)
- 🔄 **Undo & Redo functionality**
- 🎨 **Color & brush size selection**
- 🗃️ **Save & load drawings** from PostgreSQL
- 👥 **Collaborative drawing rooms** (Upcoming)
