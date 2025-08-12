/*
 * Proxy Bridge 2.0 WebSocket para Cloud Run
 * Autor: ChristopherAGT - Guatemalteco
 */

const crypto = require("crypto");
const net = require("net");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

// =======================
// Configuración inicial
// =======================
const dhost = process.env.DHOST || "127.0.0.1";
const dport = parseInt(process.env.DPORT, 10) || 40000;
const port = parseInt(process.env.PORT, 10) || 8080;
const outputFile = process.env.OUTPUT_FILE || null;
let gcwarn = true;

// =========================
// Recolección de basura
// =========================
function gcollector() {
  if (!global.gc && gcwarn) {
    console.warn("[WARNING] Garbage Collector isn't enabled! Run with --expose-gc");
    gcwarn = false;
    return;
  }
  if (global.gc) {
    global.gc();
  }
}
setInterval(gcollector, 1000);

// ==============================
// Limpieza de IP tipo "::ffff:"
// ==============================
function parseRemoteAddr(raddr) {
  const strAddr = raddr.toString();
  return strAddr.includes("ffff") ? strAddr.substring(strAddr.indexOf("ffff") + 4) : strAddr;
}

// =====================
// Servidor HTTP + WebSocket
// =====================
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Proxy Bridge WebSocket running\n");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  const clientIP = parseRemoteAddr(req.socket.remoteAddress);
  console.log(`[INFO] New WS connection from ${clientIP}`);

  const conn = net.createConnection({ host: dhost, port: dport }, () => {
    console.log(`[INFO] Connected to backend ${dhost}:${dport}`);
  });

  ws.on("message", (message) => {
    if (Buffer.isBuffer(message)) {
      conn.write(message);
      if (outputFile) fs.appendFileSync(outputFile, `[CLIENT -> DEST] ${message.toString("hex")}\n`);
    } else {
      // En caso de mensajes string, los convertimos a Buffer
      const buf = Buffer.from(message);
      conn.write(buf);
      if (outputFile) fs.appendFileSync(outputFile, `[CLIENT -> DEST] ${buf.toString("hex")}\n`);
    }
  });

  conn.on("data", (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
      if (outputFile) fs.appendFileSync(outputFile, `[DEST -> CLIENT] ${data.toString("hex")}\n`);
    }
  });

  const closeBoth = () => {
    ws.close();
    conn.destroy();
  };

  ws.on("close", () => {
    console.log(`[INFO] WS connection closed ${clientIP}`);
    conn.end();
  });

  ws.on("error", (err) => {
    console.error(`[WS ERROR] ${clientIP} - ${err.message}`);
    closeBoth();
  });

  conn.on("close", () => {
    ws.close();
  });

  conn.on("error", (err) => {
    console.error(`[REMOTE ERROR] ${dhost}:${dport} - ${err.message}`);
    closeBoth();
  });
});

server.listen(port, () => {
  console.log(`[INFO] HTTP/WebSocket Proxy running on port ${port}`);
  console.log(`[INFO] Forwarding to ${dhost}:${dport}`);
  if (outputFile) console.log(`[INFO] Logging traffic to ${outputFile}`);
});
