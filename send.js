import net from "node:net";

const parts = ["GET /heal", "th HTTP/1.1\r\nHost: x\r\n\r\n"];

const s = net.connect(800, "localhost");
s.on("data", (d) => process.stdout.write(d));
s.on("error", (e) => console.log("client error:", e.code));

parts.forEach((p, i) => setTimeout(() => s.write(p), i * 300));
