# File Reading Server: Spec

## Purpose and scope
A hand-written HTTP/1.1 server in Node.js using the `net` module. It serves a page, a health check, and a file reader: ask for a file in `./files` and it replies with the file's word count followed by its words, one per line.

## Supported requests
- Methods: `GET` and `HEAD`. Any other method gets `405 Method Not Allowed`.
- HTTP version: HTTP/1.1.
- `HEAD` returns the same status and headers as `GET`, with no body.

## Routes

### `GET /`
- Status: `200 OK`
- Content-Type: `text/html`
- Body: a small HTML page that says `File Reading Server is active!!`

### `GET /health`
- Status: `200 OK`
- Content-Type: `text/plain`
- Body: `ok`

### `GET /<filename>`
Reads `<filename>` from the `./files` folder only.
- Status: `200 OK`
- Content-Type: `text/plain`
- Body: the word count on the first line, then each word on its own line.

Example, for a file containing `hello big world`:

```
3
hello
big
world
```

## Word counting
- Split the file's text on whitespace.
- Filter out empty strings, so leading or trailing whitespace doesn't inflate the count.

## Errors

| Situation | Status |
|---|---|
| File not found | `404 Not Found` |
| Method other than GET or HEAD | `405 Method Not Allowed` |
| Malformed request line | `400 Bad Request` |
| Path traversal attempt (for example `/../x`) | `403 Forbidden` |
| File larger than the size cap | `413 Content Too Large` |
| Incomplete request | No response until the rest arrives |

## Connection behavior
- Every response includes `Connection: close`, and the socket closes after it is sent.
- `Content-Length` is the size of the body in bytes, not characters.
- A socket error closes that connection and never crashes the server.

## Out of scope
HTTPS, chunked transfer encoding, persistent connections, and full RFC compliance.

## Open questions
- What is the file size cap?
- What happens if a `GET` arrives with a body?
- How are header names handled (casing, duplicates)?
- How are files that aren't valid UTF-8 handled?
- What happens with an unsupported HTTP version?
