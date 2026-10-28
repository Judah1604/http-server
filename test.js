import test from "node:test";
import assert from "node:assert";
import net from "node:net";

function send(chunks, gap = 50) {
	return new Promise((resolve) => {
		let out = "";
		const s = net.connect(800, "localhost");
		s.on("data", (d) => (out += d));
		s.on("close", () => resolve(out));
		s.on("error", () => {});
		chunks.forEach((c, i) => setTimeout(() => s.write(c), i * gap));
	});
}

test("health returns 200 and ok", async () => {
	const res = await send(["GET /health HTTP/1.1\r\nHost: x\r\n\r\n"]);
	assert.match(res, /^HTTP\/1\.1 200 OK/);
	assert.ok(res.endsWith("ok"));
});

test("word file returns count then words", async () => {
	const res = await send(["GET /example.txt HTTP/1.1\r\nHost: x\r\n\r\n"]);
	assert.match(res, /^HTTP\/1\.1 200 OK/);
	assert.ok(res.includes("\r\n\r\n23\r\nThe"));
});

test("POST gets 405 with Allow header", async () => {
	const res = await send(["POST /health HTTP/1.1\r\nHost: x\r\n\r\n"]);
	assert.match(res, /^HTTP\/1\.1 405/);
	assert.ok(res.includes("Allow: GET, HEAD"));
});

test("path traversal gets 403", async () => {
	const res = await send(["GET /../server.js HTTP/1.1\r\nHost: x\r\n\r\n"]);
	assert.match(res, /^HTTP\/1\.1 403/);
});

test("malformed request gets 400", async () => {
	const res = await send(["garbage\r\n\r\n"]);
	assert.match(res, /^HTTP\/1\.1 400/);
});

test("split request is stitched back together", async () => {
	const res = await send(["GET /heal", "th HTTP/1.1\r\nHost: x\r\n\r\n"]);
	assert.match(res, /^HTTP\/1\.1 200 OK/);
	assert.ok(res.endsWith("ok"));
});
