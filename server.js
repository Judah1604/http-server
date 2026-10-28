import net from "node:net";
import fs from "fs";
import path from "node:path";
const port = 800;
const MAX_HEADER = 8192;

const server = net.createServer((socket) => {
	let buffer = Buffer.alloc(0);
	let done = false;

	socket.on("data", (data) => {
		if (done) return;
		buffer = Buffer.concat([buffer, data]);
		const end = buffer.indexOf("\r\n\r\n");
		if (end === -1) {
			if (buffer.length > MAX_HEADER) {
				buffer = Buffer.alloc(0);
				sendResponse(
					socket,
					431,
					"Request Header Fields Too Large",
					"text/plain",
					false,
				);
				done = true;
			}
			return;
		}
		done = true;

		const dataArr = buffer.subarray(0, end).toString().split("\r\n"),
			reqLine = dataArr[0].split(" "),
			route = reqLine[1],
			method = reqLine[0],
			headers = dataArr.slice(1, 4).join("\r\n");
		const isHead = method === "HEAD";

		if (method !== "GET" && method !== "HEAD") {
			sendResponse(
				socket,
				405,
				"Method Not Allowed",
				"text/plain",
				false,
				"Allow: GET, HEAD\r\n",
			);
			return;
		}

		if (route === "/") {
			const fileContent = fs.readFileSync("./root.html", "utf-8");
			sendResponse(socket, 200, fileContent, "text/html", isHead);
		} else if (route === "/health") {
			sendResponse(socket, 200, "ok", "text/plain", isHead);
		} else {
			const decoded = decodeURIComponent(route),
				root = path.resolve("./files"),
				full = path.resolve(root, "." + decoded);

			if (!full.startsWith(root + path.sep)) {
				sendResponse(socket, 403, "Forbidden", "text/plain");
			}

			try {
				if (fs.existsSync(full)) {
					const fileContent = fs.readFileSync(full, "utf-8"),
						wordsArr = fileContent.split(/\s+/).filter(Boolean),
						body = `${wordsArr.length}\r\n${wordsArr.join("\r\n")}`;

					if (fileContent === "") {
						sendResponse(
							socket,
							200,
							"This file is empty!",
							"text/plain",
							isHead,
						);
					} else {
						sendResponse(socket, 200, body, "text/plain", isHead);
					}
				} else {
					sendResponse(
						socket,
						404,
						"File not found!",
						"text/plain",
						isHead,
					);
				}
			} catch (err) {
				sendResponse(
					socket,
					404,
					"File not found!",
					"text/plain",
					isHead,
				);
			}
		}
	});

	socket.on("error", (err) => {
		if (err.code !== "ECONNRESET") console.log("socket error:", err.code);
	});
});

server.listen(port, () => {
	console.log("Server is listening at port " + port);
});

function sendResponse(socket, statusCode, body, fileType, isHead, extra = "") {
	const byteSize = Buffer.byteLength(body, "utf-8");

	const statusLookup = {
		200: "OK",
		403: "Forbidden",
		404: "Not Found",
		405: "Method Not Allowed",
		431: "Request Header Fields Too Large",
	};
	const head = `HTTP/1.1 ${statusCode} ${statusLookup[statusCode]}\r\nContent-Type: ${fileType}\r\nContent-Length: ${byteSize}\r\nConnection: close\r\n${extra}\r\n`;

	socket.write(isHead ? head : head + body);
	socket.end();
}
