# HTTP Server From Scratch

A small HTTP/1.1 server written in plain JavaScript on top of Node's `net` module. No `http` module, no frameworks. It reads raw TCP bytes, works out what the request is, and builds the response by hand.

It serves a home page, a health check, and a file reader: ask for a file in `./files` and it replies with the file's word count, then every word on its own line.

## Run it

```
node server.js
```

The server listens on port 800. On Linux or macOS, ports below 1024 need elevated permissions, so change `port` at the top of the file if it won't start.

Put the files you want to serve in `./files`. The home page comes from `root.html`.

## Routes

| Request | Response |
|---|---|
| `GET /` | The home page (`root.html`) |
| `GET /health` | `200 OK` with the body `ok` |
| `GET /<filename>` | The word count on the first line, then one word per line |

Example, for a file `notes.txt` containing `hello big world`:

```
$ curl.exe http://localhost:800/notes.txt
3
hello
big
world
```

Words are split on whitespace only, so punctuation stays attached (`dog.` is one word). An empty file returns a short message instead of a count.

`HEAD` works on every route and returns the same headers as `GET` with no body. Any other method gets `405` with an `Allow: GET, HEAD` header.

## Status codes

| Code | When |
|---|---|
| 200 | The request worked |
| 400 | Malformed request line, bad URL encoding, or a null byte in the path |
| 403 | The path tries to escape the files folder (for example `/../server.js`) |
| 404 | The file doesn't exist (directories count as not found) |
| 405 | A method other than GET or HEAD |
| 408 | The client connected but never finished sending a request |
| 413 | The file is over the size limit set in the code |
| 431 | The request headers are larger than 8 KB |

Every response includes `Content-Length` (measured in bytes, not characters) and `Connection: close`, and the socket closes after the response is sent.

## How it works

```
TCP bytes -> buffer -> parse -> validate -> method check -> route -> response -> close
```

1. **Buffer.** Each connection has its own buffer. TCP is a stream of bytes with no message boundaries, so one request can arrive in several pieces. The server keeps adding bytes to the buffer until it sees a blank line (`\r\n\r\n`), which marks the end of the headers.
2. **Parse.** The text before the blank line is split into the request line (method, route, version) and headers.
3. **Validate.** The request line must have exactly three parts, the route must start with `/`, and the version must look like `HTTP/x.y`. Otherwise: `400`.
4. **Method check.** Only GET and HEAD continue. Anything else gets `405`.
5. **Route.** `/` and `/health` are handled directly. Anything else is treated as a filename.
6. **File path safety.** The route is URL-decoded, resolved to a real path, and checked to be inside `./files`. Escapes get `403`. The size is checked before the file is read.
7. **Response.** One function builds the status line, headers, and body, and skips the body for HEAD.

Guard rails: a header section over 8 KB gets `431`, idle connections time out with `408`, and a `done` flag makes sure a late `data` event can't trigger a second response on a closed socket. Socket errors are caught so one bad client can't crash the server.

## Tests

Start the server in one terminal, then in another:

```
npm test
```

The tests send raw requests over a TCP socket and check the responses. They cover the health route, a word file, a wrong method (405), path traversal (403), a malformed request (400), and a request split across two TCP packets.

## Known limitations

- **Request bodies are ignored.** The parser stops at the blank line and never reads `Content-Length` on the way in, so POST-style requests with bodies aren't supported.
- **One request per connection.** Every response says `Connection: close`, so there is no keep-alive.
- **File reads block the server.** Files are read with `readFileSync`, so a large file stalls every other client while it loads. The size limit keeps this bounded.
- **Loose version check.** Anything shaped like `HTTP/x.y` passes, including versions the server doesn't actually speak.
- **Query strings aren't handled.** `/file.txt?x=1` is treated as a different filename.
- **All files are served as `text/plain`.** There's no Content-Type lookup by extension.
- **Tests need a running server.** They connect to port 800 instead of starting the server themselves.

## Out of scope

HTTPS, chunked transfer encoding, persistent connections, and full RFC compliance. This is a learning project, not a production server.