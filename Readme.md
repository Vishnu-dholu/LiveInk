/real-time-drawing-app
├── /backend # Backend (Express.js + PostgreSQL + WebSockets)
│ ├── /config # Configuration files
│ │ ├── db.js # PostgreSQL connection (ES6 modules)
│ ├── /routes # API routes
│ │ ├── drawings.js # Routes for saving & fetching drawings
│ ├── /controllers # Business logic for routes
│ │ ├── drawingController.js # Handles drawing save/load logic
│ ├── /middleware # Middleware functions (auth, validation)
│ ├── /utils # Utility functions (helper functions)
│ ├── server.js # Main Express server with WebSockets
│ ├── package.json # Backend dependencies
│ ├── Dockerfile # Docker setup for backend
│ ├── .env # Environment variables (DB, JWT secrets)
│
├── /frontend # Frontend (React + Vite + Konva.js)
│ ├── /src
│ │ ├── /components # Reusable React components
│ │ │ ├── Canvas.js # Konva.js drawing canvas
│ │ │ ├── Toolbar.js # UI controls (undo, redo, color picker)
│ │ │ ├── Shapes.js # Shape tools (rectangle, circle, line)
│ │ ├── /utils # Utility functions for frontend
│ │ ├── App.js # Main React component
│ │ ├── index.js # Entry point
│ ├── vite.config.js # Vite configuration
│ ├── package.json # Frontend dependencies
│ ├── Dockerfile # Docker setup for frontend
│
├── /database # Database initialization scripts
│ ├── init.sql # PostgreSQL table creation script
│
├── /docker # Docker & deployment configs
│ ├── docker-compose.yml # Docker Compose for backend, frontend & DB
│
├── .gitignore # Ignore unnecessary files
├── README.md # Project documentation
