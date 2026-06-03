import { io } from "socket.io-client";

// Configurations
const BACKEND_URL = "http://localhost:5001";
const args = process.argv.slice(2);
const roomId = args[0];
const numUsers = parseInt(args[1], 10) || 10;
const roomPassword = args[2] || "";

if (!roomId) {
  console.error("\x1b[31mError: Room ID is required!\x1b[0m");
  console.log("\nUsage:");
  console.log("  node load_test.js <roomId> [numUsers] [roomPassword]");
  console.log("\nExample:");
  console.log("  node load_test.js room-xyz 15 mypassword");
  process.exit(1);
}

console.log(`\n\x1b[36m=== LiveInk Automated Load Testing Tool ===\x1b[0m`);
console.log(`Target Backend:  ${BACKEND_URL}`);
console.log(`Target Room ID:  ${roomId}`);
console.log(`Simulating:      ${numUsers} concurrent users`);
console.log(`Password:        ${roomPassword ? "Yes" : "None"}\n`);

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function registerUser(index) {
  const uniqueId = Math.random().toString(36).substring(2, 9);
  const username = `LoadTester_${index}_${uniqueId}`;
  const email = `${username}@example.com`;
  const password = "password123";

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Register failed with status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      token: data.token,
      userId: data.user.id,
      username: data.user.username,
    };
  } catch (error) {
    console.error(`Failed to register user ${index}:`, error.message);
    return null;
  }
}

async function start() {
  console.log(`[1/3] Registering ${numUsers} mock users via API...`);
  const registeredUsers = [];
  for (let i = 1; i <= numUsers; i++) {
    const user = await registerUser(i);
    if (user) {
      registeredUsers.push(user);
    }
    await sleep(100);
  }

  console.log(`\n[2/3] Successfully registered ${registeredUsers.length}/${numUsers} users.`);
  if (registeredUsers.length === 0) {
    console.error("\x1b[31mNo users registered. Exiting.\x1b[0m");
    process.exit(1);
  }

  console.log(`\n[3/3] Establishing WebSocket connections & joining room...`);
  const sockets = [];
  let joinedCount = 0;
  let drawEventsSent = 0;
  let chatMessagesSent = 0;
  
  // Latency metrics tracking
  const latencyWindow = [];
  const MAX_LATENCY_WINDOW = 200;

  for (const user of registeredUsers) {
    const socket = io(BACKEND_URL, {
      auth: { token: user.token },
      transports: ["websocket"],
      forceNew: true,
    });

    socket.on("connect", () => {
      // Join Room
      socket.emit(
        "room:join",
        { roomId, userId: user.userId, username: user.username, password: roomPassword },
        (res) => {
          if (res && res.success) {
            joinedCount++;
            
            // Listen for drawing events from OTHER clients to measure latency
            socket.on("draw:live", (data) => {
              if (data && data.sentAt) {
                const rtt = Date.now() - data.sentAt;
                latencyWindow.push(rtt);
                if (latencyWindow.length > MAX_LATENCY_WINDOW) {
                  latencyWindow.shift();
                }
              }
            });

            startUserSimulation(socket, user);
          } else {
            console.error(`\x1b[31mUser ${user.username} failed to join room:\x1b[0m`, res ? res.message : "No response");
            socket.disconnect();
          }
        }
      );
    });

    socket.on("connect_error", (err) => {
      console.error(`\x1b[31mConnection error for ${user.username}:\x1b[0m`, err.message);
    });

    sockets.push(socket);
    await sleep(150);
  }

  // Periodic statistics display
  const statsInterval = setInterval(() => {
    console.clear();
    
    // Calculate average and max latency
    let avgLatency = 0;
    let maxLatency = 0;
    if (latencyWindow.length > 0) {
      const sum = latencyWindow.reduce((a, b) => a + b, 0);
      avgLatency = (sum / latencyWindow.length).toFixed(1);
      maxLatency = Math.max(...latencyWindow);
    }

    console.log(`\x1b[36m=== LiveInk Concurrent User Simulation ===\x1b[0m`);
    console.log(`Target Room ID:      ${roomId}`);
    console.log(`Simulated Users:     ${registeredUsers.length}`);
    console.log(`Successfully Joined:  \x1b[32m${joinedCount} users\x1b[0m`);
    console.log(`Draw Live Events:    ${drawEventsSent}`);
    console.log(`Chat Messages Sent:  ${chatMessagesSent}`);
    console.log(`-------------------------------------------`);
    console.log(`\x1b[35m=== Real-time Latency Metrics ===\x1b[0m`);
    console.log(`P2P Average Latency:  \x1b[33m${avgLatency} ms\x1b[0m (last ${latencyWindow.length} events)`);
    console.log(`P2P Peak Latency:     \x1b[31m${maxLatency} ms\x1b[0m`);
    console.log(`-------------------------------------------`);
    console.log(`Press Ctrl+C to terminate simulation and leave room.`);
  }, 1000);

  function startUserSimulation(socket, user) {
    let angle = Math.random() * Math.PI * 2;
    const centerX = 200 + Math.random() * 600;
    const centerY = 200 + Math.random() * 400;
    const radius = 50 + Math.random() * 100;
    const speed = 0.05 + Math.random() * 0.05;
    let strokePoints = [];

    const drawInterval = setInterval(() => {
      if (!socket.connected) {
        clearInterval(drawInterval);
        return;
      }

      angle += speed;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      strokePoints.push(x, y);

      // Emit live updates to update other clients, with timestamp
      socket.emit("draw:live", {
        points: strokePoints.slice(-10),
        tool: "pen",
        sentAt: Date.now(), // Attach current timestamp to measure latency
      });
      drawEventsSent++;

      if (strokePoints.length >= 60) {
        socket.emit("draw", {
          points: strokePoints,
          tool: "pen",
          stroke: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
          strokeWidth: 3,
          opacity: 1,
          dash: [],
          sentAt: Date.now(),
        });
        strokePoints = [];
      }
    }, 100);

    const chatInterval = setInterval(() => {
      if (!socket.connected) {
        clearInterval(chatInterval);
        return;
      }

      const messages = [
        "Hey everyone! Collaborative drawing is so cool!",
        "Testing concurrent user capacity!",
        "Wow, look at all these users drawing live!",
        "LiveInk is extremely fast!",
        "This is an automated load test message.",
        "Smooth real-time drawing experience!",
      ];
      const randomText = messages[Math.floor(Math.random() * messages.length)];

      socket.emit("room:message", {
        roomId,
        message: {
          username: user.username,
          text: randomText,
          timestamp: Date.now(),
        },
      });
      chatMessagesSent++;
    }, 8000 + Math.random() * 4000);
  }

  process.on("SIGINT", () => {
    clearInterval(statsInterval);
    console.log("\n\x1b[33mStopping load test...\x1b[0m");
    for (const socket of sockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    console.log("All simulated clients disconnected. Goodbye!\n");
    process.exit(0);
  });
}

start();
