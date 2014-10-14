---
title: Cluster机制剖析1——进程复制
date: '2014-10-14'
permalink: /2014-10-14/cluster-analyse-one
categories:
- js
tags:
- node
---

## Cluster机制剖析1——进程的复制

Cluster相信大家都很熟悉，这里就不再赘述了，引用官网的一段话：

>A single instance of Node runs in a single thread. To take advantage of multi-core systems the user will sometimes want to launch a cluster of Node processes to handle the load.

本文将基于`node_v0.10.32`来八一八它的实现原理。

### Fork

[fork()](http://en.wikipedia.org/wiki/Fork_(system_call)是类UNIX系统父进程复制子进程的系统调用，在Node里通过[libuv](https://github.com/joyent/libuv)实现了对不同平台(unix,linux,windows)的封装。引用[百度百科](http://baike.baidu.com/view/1952900.htm)的一段话来描述`fork`的特性：

>fork之后的子进程是父进程的副本，它将获得父进程数据空间、堆、栈等资源的副本。注意，子进程持有的是上述存储空间的“副本”，这意味着父子进程间不共享这些存储空间。

其实，在node的`cluster`模式里，worker进程的产生也是调用了`require('child_process').fork`。

**那直接这样不就行了？**

```
var fork = require('child_process').fork;
var cpuNums = require('os').cpus().length;
var workerPath = require('path').join(__dirname, 'worker.js'); 

for (var i = 0; i < cpuNums; i++) {
  fork(workerPath, { env: process.env });
}
```

这样的方式仅仅实现了多进程。多进程运行还涉及**父子进程通信，子进程管理，以及负载均衡**等问题，这些特性`cluster`帮你实现了，在后面的章节会一一道来。

### 两种逻辑

先看一个官网的例子：

```
var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
} else {
  // Workers can share any TCP connection
  // In this case its a HTTP server
  http.createServer(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
  }).listen(8000);
}
```

以上代码的意思是：如果是父进程（Master），就复制多个子进程，子进程的数目等于CPU核心数。如果是子进程（Worker），就创建一个http服务器并监听8000端口。

我们在前面提到，子进程是父进程的“副本”，将得到父进程的数据（代码）空间及堆栈，因此，父子进程会执行**同一段代码逻辑**。这样就需要一种机制，能够在代码里区分当前进程是父进程还是子进程。首先来看看神秘的`cluster`模块究竟是什么：

```
// lib/cluster.js

function Cluster() {
  EventEmitter.call(this);
}

util.inherits(Cluster, EventEmitter);

var cluster = module.exports = new Cluster();
```

它是一个`Object`，通过继承`EventEmitter`，使它有了事件驱动机制。

```
// Define isWorker and isMaster
cluster.isWorker = 'NODE_UNIQUE_ID' in process.env;
cluster.isMaster = ! cluster.isWorker;
```
可以看到`cluster`下有两个flag来标识区分当前进程，依据是当前进程的环境变量（`env`）里是否包含`NODE_UNIQUE_ID`这个字段。**为什么子进程的环境变量里有这个字段而父进程没有？**

我们知道，在复制子进程的时候实际上是调用了`require('child_process').fork`，看一下这个方法的用法：

```
child_process.fork(modulePath, [args], [options])
  modulePath String The module to run in the child
  args Array List of string arguments
  options Object
    cwd String Current working directory of the child process
    env Object Environment key-value pairs
    encoding String (Default: 'utf8')
    execPath String Executable used to create the child process
    execArgv Array List of string arguments passed to the executable (Default: process.execArgv)
    silent Boolean If true, stdin, stdout, and stderr of the child will be piped to the parent, otherwise they will be inherited from the parent, see the "pipe" and "inherit" options for spawn()'s stdio for more details (default is false)
  Return: ChildProcess object
```

可以看到方法的第三个参数`options`是个对象，其中`options.env`可以设置子进程的环境变量，即`process.env`。因此，可以推测，应该是这里调用的时候，在env里面添加了`NODE_UNIQUE_ID`这个标识。接下来就来看下代码：

```
function Worker(customEnv) {
  ...
  // Create or get process
  if (cluster.isMaster) {

    // Create env object
    // first: copy and add id property
    var envCopy = util._extend({}, env);
    envCopy['NODE_UNIQUE_ID'] = this.id;
    // second: extend envCopy with the env argument
    if (isObject(customEnv)) {
      envCopy = util._extend(envCopy, customEnv);
    }

    // fork worker
    this.process = fork(settings.exec, settings.args, {
      'env': envCopy,
      'silent': settings.silent,
      'execArgv': settings.execArgv
    });
  } else {
    this.process = process;
  }
  ...
}
```

以上代码段印证了之前的推测，就不再赘述了。

还有个细节需要注意：

```
// src/node.js
if (process.env.NODE_UNIQUE_ID) {
  var cluster = NativeModule.require('cluster');
  cluster._setupWorker();

  // Make sure it's not accidentally inherited by child processes.
  delete process.env.NODE_UNIQUE_ID;
}
```

在Node进程启动的时候，子进程会执行以上代码，我们先不追究`_setupWorker`的细节。可以看到`NODE_UNIQUE_ID`从环境变量里剔除了，这使得子进程可以作为Master继续复制子进程。

### 进程复制

继续官网的示例，我们先看父进程的执行逻辑：

```
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
}
```

很明显，主要就是执行`fork`调用。那我们就来看看`cluster.fork`做了什么？

```
// Fork a new worker
cluster.fork = function(env) {
  // This can only be called from the master.
  assert(cluster.isMaster);

  // Make sure that the master has been initialized
  cluster.setupMaster();

  return (new cluster.Worker(env));
};
```

先`setupMaster`，再返回一个`cluster.Worker`实例。其实`workder`实例化的代码在前面已经贴过了，我们来个完整版：

```
// Create a worker object, that works both for master and worker
function Worker(customEnv) {
  if (!(this instanceof Worker)) return new Worker();
  EventEmitter.call(this);

  var self = this;
  var env = process.env;

  // Assign a unique id, default null
  this.id = cluster.isMaster ? ++ids : toDecInt(env.NODE_UNIQUE_ID);

  // XXX: Legacy.  Remove in 0.9
  this.workerID = this.uniqueID = this.id;

  // Assign state
  this.state = 'none';

  // Create or get process
  if (cluster.isMaster) {

    // Create env object
    // first: copy and add id property
    var envCopy = util._extend({}, env);
    envCopy['NODE_UNIQUE_ID'] = this.id;
    // second: extend envCopy with the env argument
    if (isObject(customEnv)) {
      envCopy = util._extend(envCopy, customEnv);
    }

    // fork worker
    this.process = fork(settings.exec, settings.args, {
      'env': envCopy,
      'silent': settings.silent,
      'execArgv': settings.execArgv
    });
  } else {
    this.process = process;
  }

  if (cluster.isMaster) {
    // Save worker in the cluster.workers array
    cluster.workers[this.id] = this;

    // Emit a fork event, on next tick
    // There is no worker.fork event since this has no real purpose
    process.nextTick(function() {
      cluster.emit('fork', self);
    });
  }

  // handle internalMessage, exit and disconnect event
  this.process.on('internalMessage', handleMessage.bind(null, this));
  this.process.once('exit', function(exitCode, signalCode) {
    prepareExit(self, 'dead');
    self.emit('exit', exitCode, signalCode);
    cluster.emit('exit', self, exitCode, signalCode);
  });
  this.process.once('disconnect', function() {
    prepareExit(self, 'disconnected');
    self.emit('disconnect');
    cluster.emit('disconnect', self);
  });

  // relay message and error
  this.process.on('message', this.emit.bind(this, 'message'));
  this.process.on('error', this.emit.bind(this, 'error'));

}
```

每个worker分配了一个`id`，注册在`cluster.workers`里。父进程和子进程注册了一堆事件，这些事件涉及父子进程通讯，我们在下一篇文章里详细讨论。接下来，我们再看看`setupMaster`做了什么：

```
cluster.setupMaster = function(options) {
  // This can only be called from the master.
  assert(cluster.isMaster);

  // Don't allow this function to run more than once
  if (masterStarted) return;
  masterStarted = true;

  // Get filename and arguments
  options = options || {};

  // By default, V8 writes the profile data of all processes to a single
  // v8.log.
  //
  // Running that log file through a tick processor produces bogus numbers
  // because many events won't match up with the recorded memory mappings
  // and you end up with graphs where 80+% of ticks is unaccounted for.
  //
  // Fixing the tick processor to deal with multi-process output is not very
  // useful because the processes may be running wildly disparate workloads.
  //
  // That's why we fix up the command line arguments to include
  // a "--logfile=v8-%p.log" argument (where %p is expanded to the PID)
  // unless it already contains a --logfile argument.
  var execArgv = options.execArgv || process.execArgv;
  if (execArgv.some(function(s) { return /^--prof/.test(s); }) &&
      !execArgv.some(function(s) { return /^--logfile=/.test(s); }))
  {
    execArgv = execArgv.slice();
    execArgv.push('--logfile=v8-%p.log');
  }

  // Set settings object
  settings = cluster.settings = {
    exec: options.exec || process.argv[1],
    execArgv: execArgv,
    args: options.args || process.argv.slice(2),
    silent: options.silent || false
  };

  // emit setup event
  cluster.emit('setup');
};
```

这里是复制子进程之前的一些准备工作。你可以显示调用这个方法并传入一些配置，主要就是指定子进程的执行入口`options.exec`，如果像官网例子那样不显式调用，则默认把当前文件作为入口。

### 最后

敬请期待后续文章。
