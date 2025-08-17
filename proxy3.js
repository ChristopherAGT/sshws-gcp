/*
 * Proxy Bridge 2.1 - Mejorada
 * Autor: ChristopherAGT - Guatemalteco
 * Adaptada para Cloud Run
 */

const crypto = require("crypto");
const net = require("net");
const fs = require("fs");
const http = require("http");

// =======================
// Configuración inicial
// =======================
let dhost = process.env.DHOST || "127.0.0.1";
let dport = parseInt(process.env.DPORT, 10) || 40000;
let mainPort = parseInt(process.env.PORT, 10) || 8080;  // Cloud Run setea PORT
let outputFile = null;
let packetsToSkip = parseInt(process.env.PACKSKIP, 10) || 1;
let gcwarn = true;

// =======================
// Argumentos por consola
// =======================
for (let i = 0; i < process.argv.length; i++) {
    switch (process.argv[i]) {
        case "-skip": packetsToSkip = parseInt(process.argv[i + 1], 10) || packetsToSkip; break;
        case "-dhost": dhost = process.argv[i + 1] || dhost; break;
        case "-dport": dport = parseInt(process.argv[i + 1], 10) || dport; break;
        case "-mport": mainPort = parseInt(process.argv[i + 1], 10) || mainPort; break;
        case "-o": outputFile = process.argv[i + 1] || null; break;
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
    if (global.gc) global.gc();
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
// Crear servidor TCP
// =====================
const serverTCP = net.createServer();

serverTCP.on("connection", (socket) => {
    let packetCount = 0;
    const clientIP = parseRemoteAddr(socket.remoteAddress);
    const clientPort = socket.remotePort;

    // Simula handshake WebSocket falso
    const wsAccept = Buffer.from(crypto.randomBytes(20)).toString("base64");
    socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n` +
        `Connection: Upgrade\r\n` +
        `Date: ${new Date().toUTCString()}\r\n` +
        `Sec-WebSocket-Accept: ${wsAccept}\r\n` +
        `Upgrade: websocket\r\n` +
        `Server: p7ws/0.1a\r\n\r\n`
    );

    console.log(`[INFO] New connection from ${clientIP}:${clientPort}`);

    const conn = net.createConnection({ host: dhost, port: dport });

    // Cliente → Proxy → Destino
    socket.on("data", (data) => {
        if (packetCount++ >= packetsToSkip) {
            conn.write(data);
            if (outputFile) fs.promises.appendFile(outputFile, `[CLIENT -> DEST] ${data.toString("hex")}\n`).catch(() => {});
        }
    });

    // Destino → Proxy → Cliente
    conn.on("data", (data) => {
        socket.write(data);
        if (outputFile) fs.promises.appendFile(outputFile, `[DEST -> CLIENT] ${data.toString("hex")}\n`).catch(() => {});
    });

    // Manejo de cierre y errores
    const closeBoth = () => {
        if (!socket.destroyed) socket.destroy();
        if (!conn.destroyed) conn.destroy();
    };

    socket.on("error", (err) => {
        console.error(`[SOCKET ERROR] ${clientIP}:${clientPort} - ${err.message}`);
        closeBoth();
    });

    conn.on("error", (err) => {
        console.error(`[REMOTE ERROR] ${dhost}:${dport} - ${err.message}`);
        closeBoth();
    });

    socket.once("close", () => {
        console.log(`[INFO] Connection closed ${clientIP}:${clientPort}`);
        conn.end();
    });

    conn.once("close", () => {
        socket.end();
    });
});

// =====================
// Servidor HTTP para Cloud Run
// =====================
const serverHTTP = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Proxy alive\n");
});

serverHTTP.listen(mainPort, "0.0.0.0", () => {
    console.log(`[INFO] HTTP listener running on 0.0.0.0:${mainPort}`);
    console.log(`[INFO] TCP Proxy forwarding to ${dhost}:${dport}`);
});

// Escuchar TCP en puerto interno diferente (ej: 4000)
const tcpPort = 4000;
serverTCP.listen(tcpPort, "0.0.0.0", () => {
    console.log(`[INFO] TCP Proxy server running on 0.0.0.0:${tcpPort}`);
});
