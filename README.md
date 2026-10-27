# HTTP server from scratch

A small HTTP/1.1 server in Node.js using only the `net` module.

Routes: `/`, `/health`, `/<filename>` (word count plus words, from ./files).
Methods: GET and HEAD. Anything else gets 405.

Known limitations (work in progress):
- No path traversal protection yet
- Assumes one TCP data event is one request