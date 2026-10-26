# Day 1: Request/Response Pair

## Request

```
GET / HTTP/1.1
Host: developer.mozilla.org
Accept-Language: fr

```

- `GET / HTTP/1.1` is the request line: method, target, version.
- `Host: ...` and `Accept-Language: ...` are headers, one per line, as `Name: value`.
- The empty line after the headers marks the end of the headers. This is how a server knows the request header section is complete.
- There is no body, because a plain `GET` doesn't carry one.
- On the wire, every line ends with `\r\n`, not just `\n`.

## Response

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 31

<html><body>Hello</body></html>
```

- `HTTP/1.1 200 OK` is the status line: version, status code, reason phrase.
- `Content-Type` and `Content-Length` are headers.
- The empty line marks the end of the headers.
- Everything after it is the body. `Content-Length: 31` tells the client how many bytes of body to read.

## TCP vs HTTP

TCP delivers in an unending stream of data, there is no concept of stopping or gauging the data to send with TCP. It sends this data in chunks bound to each other's ends, hence making the difference between 40 lines of HTML and a small text file with three characters non-distinguishable.

<!-- Your turn: rewrite the HTTP half in your own words. Keep two ideas:
1. HTTP decides where a message ends: headers end at the blank line, and Content-Length says how many body bytes follow.
2. Also say why one request can arrive in several `data` events (or two requests in one), which is why you can't assume one data event equals one request. -->
