/*
 * WS Proxy Bridge 3.0
 * Autor: ChristopherAGT - Guatemalteco
 */

const http = require("http");
const net = require("net");
const fs = require("fs");
const WebSocket = require("ws");

// =======================
// Configuración inicial
// =======================
let dhost = process.env.DHOST || "127.0.0.1";
let dport = parseInt(process.env.DPORT, 10) || 40000;
let mainPort = parseInt(process.env.PORT, 10) || 8080;  // Cloud Run asigna PORT
let wsPath = process.env.WS_PATH || "/";                // Ruta del WebSocket
let outputFile = null;
let packetsToSkip = parseInt(process.env.PACKSKIP, 10) || 1;
let gcwarn = true;

// =======================
// Argumentos por consola
// =======================
for (let i = 0; i < process.argv.length; i++) {
    switch (process.argv[i]) {
        case "-skip":
            packetsToSkip = parseInt(process.argv[i + 1], 10) || packetsToSkip;
            break;
        case "-dhost":
            dhost = process.argv[i + 1] || dhost;
            break;
        case "-dport":
            dport = parseInt(process.argv[i + 1], 10) || dport;
            break;
        case "-mport":
            mainPort = parseInt(process.argv[i + 1], 10) || mainPort;
            break;
        case "-o":
            outputFile = process.argv[i + 1] || null;
            break;
        case "-path":
            wsPath = process.argv[i + 1] || wsPath;
            break;
    }
}

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

// =====================
// Servidor HTTP + WS
// =====================
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WS Proxy Bridge 3.0 running\n");
});

const wss = new WebSocket.Server({ server, path: wsPath });

wss.on("connection", (ws, req) => {
    let packetCount = 0;
    const clientIP = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;

    console.log(`[INFO] New WS connection from ${clientIP}:${clientPort}`);

    // Conexión TCP hacia el destino
    const conn = net.createConnection({ host: dhost, port: dport });

    // WS -> Destino
    ws.on("message", (msg) => {
        if (packetCount++ >= packetsToSkip) {
            conn.write(msg);
            if (outputFile) {
                fs.appendFileSync(outputFile, `[CLIENT -> DEST] ${Buffer.from(msg).toString("hex")}\n`);
            }
        }
    });

    // Destino -> WS
    conn.on("data", (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
        if (outputFile) {
            fs.appendFileSync(outputFile, `[DEST -> CLIENT] ${data.toString("hex")}\n`);
        }
    });

    // Errores y cierre
    const closeBoth = () => {
        try { ws.close(); } catch {}
        try { conn.destroy(); } catch {}
    };

    ws.on("error", (err) => {
        console.error(`[WS ERROR] ${clientIP}:${clientPort} - ${err.message}`);
        closeBoth();
    });

    conn.on("error", (err) => {
        console.error(`[REMOTE ERROR] ${dhost}:${dport} - ${err.message}`);
        closeBoth();
    });

    ws.on("close", () => {
        console.log(`[INFO] WS closed ${clientIP}:${clientPort}`);
        conn.end();
    });

    conn.on("close", () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

// Escuchar en 0.0.0.0
server.listen(mainPort, "0.0.0.0", () => {
    console.log(`[INFO] WS Proxy running on 0.0.0.0:${mainPort}${wsPath}`);
    console.log(`[INFO] Forwarding to ${dhost}:${dport}`);
    if (outputFile) console.log(`[INFO] Logging traffic to ${outputFile}`);
});
