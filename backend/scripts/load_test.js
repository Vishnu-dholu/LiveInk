/**
 * LiveInk load test.
 *
 * Starts its own backend (separate port), creates N temporary users and one room
 * directly in the database, simulates drawing / chat traffic over WebSockets,
 * prints a metrics report, then deletes everything it created.
 *
 * Usage (from backend/):
 *   node scripts/load_test.js [numUsers=30] [durationSeconds=30]
 */
import { spawn, spawnSync } from "child_process";
import { io } from "socket.io-client";
import jwt from "jsonwebtoken";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { JWT_SECRET } from "../config/env.js";
import pool from "../db.js";

const numUsers = parseInt(process.argv[2], 10) || 30;
const durationSec = parseInt(process.argv[3], 10) || 30;
const PORT = 5055;
const URL = `http://localhost:${PORT}`;
const PREFIX = "loadtest_";
const ROOM_ID = `lt${Date.now().toString(36)}`.slice(0, 12);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const backendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function summarize(samples) {
  const s = [...samples].sort((a, b) => a - b);
  const avg = s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0;
  return {
    n: s.length,
    avg: +avg.toFixed(1),
    p50: percentile(s, 50),
    p95: percentile(s, 95),
    p99: percentile(s, 99),
    max: s.length ? s[s.length - 1] : 0,
  };
}

// ---- server process + resource sampling (Windows PowerShell or ps) ----
function sampleProcess(pid) {
  if (process.platform === "win32") {
    const r = spawnSync(
      "powershell",
      ["-NoProfile", "-Command", `$p=Get-Process -Id ${pid}; "$($p.CPU) $($p.WorkingSet64)"`],
      { encoding: "utf8" },
    );
    const [cpu, rss] = r.stdout.trim().split(" ").map(Number);
    return { cpuSec: cpu, rssMb: rss / 1048576 };
  }
  const r = spawnSync("ps", ["-o", "cputimes=,rss=", "-p", String(pid)], { encoding: "utf8" });
  const [cpu, rss] = r.stdout.trim().split(/\s+/).map(Number);
  return { cpuSec: cpu, rssMb: rss / 1024 };
}

async function startServer() {
  const child = spawn("node", ["server.js"], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  for (let i = 0; i < 60; i++) {
    if (log.includes("Backend server running")) return child;
    if (child.exitCode !== null) throw new Error(`Server exited early:\n${log}`);
    await sleep(500);
  }
  throw new Error(`Server did not start:\n${log}`);
}

async function setup() {
  const users = [];
  for (let i = 0; i < numUsers; i++) {
    const username = `${PREFIX}${i}_${Date.now().toString(36)}`;
    const r = await pool.query(
      "INSERT INTO users (username, email, password, provider, provider_id) VALUES ($1, $2, NULL, 'loadtest', $3) RETURNING id",
      [username, `${username}@example.invalid`, username],
    );
    const id = r.rows[0].id;
    users.push({ id, username, token: jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" }) });
  }
  await pool.query(
    "INSERT INTO rooms (id, name, password, creator_id) VALUES ($1, $2, '', $3)",
    [ROOM_ID, `${PREFIX}room`, users[0].id],
  );
  return users;
}

async function cleanup() {
  await pool.query("DELETE FROM rooms WHERE id = $1", [ROOM_ID]);
  await pool.query("DELETE FROM users WHERE provider = 'loadtest' AND username LIKE $1", [`${PREFIX}%`]);
}

async function run() {
  console.log(`LiveInk load test: ${numUsers} users, ${durationSec}s, room ${ROOM_ID}`);
  const users = await setup();
  const server = await startServer();
  const cores = os.cpus().length;

  const lat = { live: [], ops: [], chat: [] };
  const sent = { live: 0, ops: 0, chat: 0 };
  const recv = { live: 0, ops: 0, chat: 0 };
  const joinTimes = [];
  const errors = [];
  let joined = 0;
  let connectFailures = 0;
  const sockets = [];
  const timers = [];

  // ---- connect + join ----
  await Promise.all(
    users.map(async (user, idx) => {
      await sleep(idx * 40);
      const socket = io(URL, { auth: { token: user.token }, transports: ["websocket"], forceNew: true });
      sockets.push(socket);
      socket.on("room:message", (m) => {
        const t = /^lt:(\d+)/.exec(m.text);
        if (t) {
          lat.chat.push(Date.now() - Number(t[1]));
          recv.chat++;
        }
      });
      socket.on("draw:live", (d) => {
        if (d?.sentAt) {
          lat.live.push(Date.now() - d.sentAt);
          recv.live++;
        }
      });
      socket.on("canvas:ops", (ops) => {
        for (const op of ops) {
          if (op.op === "add" && op.item?.sentAt) {
            lat.ops.push(Date.now() - op.item.sentAt);
            recv.ops++;
          }
        }
      });
      socket.on("error", (e) => errors.push(String(e)));

      await new Promise((resolve) => {
        const t0 = Date.now();
        socket.on("connect_error", (e) => {
          connectFailures++;
          errors.push(`connect_error: ${e.message}`);
          resolve();
        });
        socket.on("connect", () => {
          socket.emit("room:join", { roomId: ROOM_ID, password: "" }, (res) => {
            if (res?.success) {
              joined++;
              joinTimes.push(Date.now() - t0);
            } else {
              errors.push(`join failed: ${res?.message}`);
            }
            resolve();
          });
        });
      });
    }),
  );

  console.log(`Joined ${joined}/${numUsers} users. Running traffic for ${durationSec}s...`);

  // ---- traffic: ~10 live points/s, 1 stroke / 3s, 1 chat / ~10s per user ----
  const active = sockets.filter((s) => s.connected);
  const start = Date.now();
  let opCounter = 0;
  for (const [i, socket] of active.entries()) {
    let angle = Math.random() * 6.28;
    const cx = 200 + Math.random() * 600;
    const cy = 200 + Math.random() * 400;

    timers.push(
      setInterval(() => {
        angle += 0.08;
        socket.emit("draw:live", {
          points: [cx + Math.cos(angle) * 80, cy + Math.sin(angle) * 80],
          tool: "pen",
          socketId: socket.id,
          sentAt: Date.now(),
        });
        sent.live++;
      }, 100),
    );

    timers.push(
      setInterval(() => {
        const pts = [];
        for (let k = 0; k < 30; k++) pts.push(cx + k, cy + Math.sin(k / 3) * 20);
        socket.emit("canvas:ops", [
          {
            op: "add",
            kind: "line",
            item: { id: `${ROOM_ID}-${i}-${opCounter++}`, points: pts, stroke: "black", strokeWidth: 2, sentAt: Date.now() },
          },
        ]);
        sent.ops++;
      }, 3000 + Math.random() * 200),
    );

    timers.push(
      setInterval(() => {
        socket.emit("room:message", { roomId: ROOM_ID, message: { text: `lt:${Date.now()} load test message` } });
        sent.chat++;
      }, 9000 + Math.random() * 2000),
    );
  }

  // ---- sample server CPU / memory ----
  const samples = [];
  let prev = sampleProcess(server.pid);
  let prevT = Date.now();
  const baselineRss = prev.rssMb;
  const sampler = setInterval(() => {
    const cur = sampleProcess(server.pid);
    const now = Date.now();
    const cpuPct = ((cur.cpuSec - prev.cpuSec) / ((now - prevT) / 1000) / cores) * 100;
    samples.push({ cpuPct, rssMb: cur.rssMb });
    prev = cur;
    prevT = now;
  }, 2000);

  await sleep(durationSec * 1000);

  timers.forEach(clearInterval);
  clearInterval(sampler);
  await sleep(1500); // let in-flight events arrive
  const elapsed = (Date.now() - start) / 1000;

  // ---- persistence check (debounced save is 2s) ----
  await sleep(3000);
  const row = await pool.query("SELECT canvas_state FROM rooms WHERE id = $1", [ROOM_ID]);
  const savedLines = row.rows[0]?.canvas_state?.lines?.length ?? 0;

  sockets.forEach((s) => s.disconnect());
  server.kill();
  await cleanup();
  await pool.end();

  const n = active.length;
  const expected = {
    live: sent.live * (n - 1),
    ops: sent.ops * (n - 1),
    chat: sent.chat * n,
  };
  const pct = (a, b) => (b ? +((a / b) * 100).toFixed(2) : 100);
  const cpuAvg = samples.length ? samples.reduce((a, s) => a + s.cpuPct, 0) / samples.length : 0;

  const report = {
    config: { users: numUsers, durationSec, cores },
    connections: {
      joined,
      connectFailures,
      joinMs: summarize(joinTimes),
    },
    traffic: {
      sent,
      received: recv,
      deliveryPct: {
        drawLive: pct(recv.live, expected.live),
        canvasOps: pct(recv.ops, expected.ops),
        chat: pct(recv.chat, expected.chat),
      },
      sentPerSec: +((sent.live + sent.ops + sent.chat) / elapsed).toFixed(1),
      deliveredPerSec: +((recv.live + recv.ops + recv.chat) / elapsed).toFixed(1),
    },
    latencyMs: { drawLive: summarize(lat.live), canvasOps: summarize(lat.ops), chat: summarize(lat.chat) },
    persistence: { opsSent: sent.ops, linesSavedInDb: savedLines },
    server: {
      cpuAvgPct: +cpuAvg.toFixed(1),
      cpuPeakPct: +Math.max(0, ...samples.map((s) => s.cpuPct)).toFixed(1),
      rssStartMb: +baselineRss.toFixed(0),
      rssPeakMb: +Math.max(baselineRss, ...samples.map((s) => s.rssMb)).toFixed(0),
    },
    errors: [...new Set(errors)].slice(0, 5),
  };
  console.log(JSON.stringify(report, null, 2));
}

run().catch(async (err) => {
  console.error("Load test failed:", err.message);
  try {
    await cleanup();
    await pool.end();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
