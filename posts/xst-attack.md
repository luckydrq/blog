---
title: XST攻击浅析
date: '2014-11-06'
description:
permalink: /2014-11-06/xst-attack
categories:
- web security
tags:
- xst
---

最近在考虑node项目里web安全相关的问题，公司的安全同学要求在生产环境禁用`HTTP TRACE`。于是就研究了一下，发现利用`TRACE`攻击一旦得手的话，风险会很大。

## Cross-Site Tracing

XST的全称是`Cross-Site Tracing`，名称上和我们熟知的`XSS`(Cross-Site Scripting)很相似。但两者其实是没有什么关系的。客户端发`TRACE`请求至服务器，如果服务器按照[标准](http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)实现了TRACE响应，则在`response body`里会返回此次请求的完整头信息。通过这种方式，客户端可以获取某些敏感的头字段，例如`httpOnly`的cookie。

下面我们基于koa来实现一个简单的支持`TRACE`方法的服务器：

```
var koa = require('koa');
var app = koa();

app.use(function* (next) {
  this.cookies.set('a', 1, { httpOnly: true });
  if (this.method === 'TRACE') {
    var body = '';
    for (header in this.headers) {
      body += header + ': ' + this.headers[header] + '\r\n';
    }
    this.body = body;
  }
  yield* next;
});

app.listen(7001);
```

启动服务后，先发个GET请求 `curl -i http://127.0.0.1:7001`，得到如下响应：

```
HTTP/1.1 200 OK
X-Powered-By: koa
Set-Cookie: a=1; path=/; httponly
Content-Type: text/plain; charset=utf-8
Content-Length: 2
Date: Thu, 06 Nov 2014 05:04:42 GMT
Connection: keep-alive

OK
```

服务器设置了一个`httpOnly`的cookie`a=1`，在浏览器环境中，是无法通过脚本获取它的。

接着我们发`TRACE`请求到服务器`curl -X TRACE -b a=1 -i http://127.0.0.1:7001`，并带上cookie，得到如下响应：

```
HTTP/1.1 200 OK
X-Powered-By: koa
Set-Cookie: a=1; path=/; httponly
Content-Type: text/plain; charset=utf-8
Content-Length: 73
Date: Thu, 06 Nov 2014 05:07:47 GMT
Connection: keep-alive

user-agent: curl/7.37.1
host: 127.0.0.1:7001
accept: */*
cookie: a=1
```

在响应体里可以看到完整的头信息，这样我们就绕过了`httpOnly`的限制，拿到了cookie`a=1`，造成了很大的风险。

## 应对策略

目前主流的浏览器在xhr请求里都禁止了`TRACE`方法，一定程度上降低了风险。但是，第三方插件如flash，仍存在可以发`TRACE`请求的风险。

因此，无论如何请禁用`TRACE`方法。

## Reference

[http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html](http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)
[http://deadliestwebattacks.com/2010/05/18/cross-site-tracing-xst-the-misunderstood-vulnerability/](http://deadliestwebattacks.com/2010/05/18/cross-site-tracing-xst-the-misunderstood-vulnerability/)
