import net from "node:net";
import fs from "fs";
const port = 800;

const server = net.createServer((socket) => {
	socket.on("data", (data) => {
		const dataArr = data.toString().split("\r\n"),
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
			const filepath = "./files" + route;
			try {
				if (fs.existsSync(filepath)) {
					const fileContent = fs.readFileSync(filepath, "utf-8"),
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
	socket.on("error", (err) => console.log("socket error:", err.code));
});

server.listen(port, () => {
	console.log("Server is listening at port " + port);
});

function sendResponse(socket, statusCode, body, fileType, isHead, extra = "") {
	const byteSize = Buffer.byteLength(body, "utf-8");

	const statusLookup = {
		200: "OK",
		404: "Not Found",
		405: "Method Not Allowed",
	};
	const head = `HTTP/1.1 ${statusCode} ${statusLookup[statusCode]}\r\nContent-Type: ${fileType}\r\nContent-Length: ${byteSize}\r\nConnection: close\r\n${extra}\r\n`;

	socket.write(isHead ? head : head + body);
	socket.end();
}
