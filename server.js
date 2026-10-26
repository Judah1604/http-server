import net from "node:net";
import fs from "node:fs";
const port = 800;

const server = net.createServer((socket) => {
	socket.on("data", (data) => {
		const dataArr = data.toString().split("\r\n"),
			reqLine = dataArr[0].split(" "),
			route = reqLine[1],
			versionStr = reqLine[2],
			headers = dataArr.slice(1, 4).join("\r\n");

		if (route === "/") {
			const fileContent = fs.readFileSync("./root.html", "utf-8");
			sendResponse(socket, versionStr, 200, fileContent, "text/html");
		} else if (route === "/health") {
			sendResponse(socket, versionStr, 200, "ok", "text/plain");
		} else {
			const filepath = "./files" + route;
			try {
				if (fs.statSync(filepath).isFile()) {
					const fileContent = fs.readFileSync(filepath, "utf-8"),
						wordsArr = fileContent.split(/\s+/).filter(Boolean),
						body = `${wordsArr.length}\r\n${wordsArr.join("\r\n")}`;

					sendResponse(socket, versionStr, 200, body, "text/plain");
				}
			} catch (err) {
				sendResponse(
					socket,
					versionStr,
					404,
					"File not found!",
					"text/plain",
				);
			}
		}
	});
    socket.on("error", (err) => console.log("socket error:", err.code));
});


server.listen(port, () => {
	console.log("Server is listening at port " + port);
});

function sendResponse(socket, versionStr, status, body, fileType) {
	const byteSize = Buffer.byteLength(body, "utf-8");
	let statusText = "";

	if (status === 200) {
		statusText = "OK";
	} else if (status === 404) {
		statusText = "NOT FOUND";
	}

	const response = `${versionStr} ${status} ${statusText}\r\nContent-Type: ${fileType}\r\nContent-Length: ${byteSize}\r\nConnection: close\r\n\r\n${body}`;

	socket.write(response);
	socket.end();
}
