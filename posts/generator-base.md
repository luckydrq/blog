---
title: Generator基础篇
date: '2014-07-13'
permalink: /2014-07-13/generator-base
categories:
- js
tags:
- node
---

众所周知，[Generator](http://wiki.ecmascript.org/doku.php?id=harmony:generators)是`ES6`的新特性，通过`yield`关键字，可以让函数的执行流挂起。本文对`Generator`的基本特性进行介绍，若
有错误请指正。(注：本文的代码在node v0.11.9下运行，node下的实现和标准有些偏差，文中将会进行注释)

### Generator和Generator Object

#### 什么是`Generator`?

```javascript
  function *gen(){
    yield 1;
  };

  console.log(typeof gen);           // function
```

这样就完成了一个`Generator`的声明，它是一个函数。

如何判断一个函数是否`Generator`？

```javascript
  function isGen(fn) {
    return 'function' === typeof fn
          && fn.constructor.name === 'GeneratorFunction';
  }
```

#### 什么是`Generator Object`？

```javascript
  function *gen(){}

  var g = gen();
  console.log(typeof g);  // object
```

`g`是一个`Generator Object`，它是一个对象，[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/1.7#Generators)上也称它为`generator-iterator`。

### Hello World

```javascript
  function *gen() {
    yield 'Hello';
    yield 'World';
  }

  var g = gen();
  console.log(g.next());    // {value: 'Hello', done: false}
  console.log(g.next());    // {value: 'World', done: false}
  console.log(g.next());    // {value: undefined, done: true}
  console.log(g.next());    // Error: Generator has already finished
```

`gen()`生成一个`Generator Object`并赋值给`g`，此时函数体尚未开始执行。
第一次调用`g.next`时，函数体开始执行，直到遇到第一个`yield`语句，执行流挂起(suspend)，同时返回一个`Object`对象。
这个对象有`value`和`done`两个key，`value`表示`yield`语句后面的表达式的值（'hello'），`done`是个布尔值，表示函数体是否已经执行结束。
再次调用`g.next`时，执行流在挂起的地方继续执行，直到遇到第2个`yield`，依次类推。。
经过2次调用，函数体已经执行到了末尾，此时函数处于挂起状态，还没有跳出，因此`done`的值仍是`false`。
再次调用`g.next`，（函数体）才执行完毕。这里值得注意的是，每次调用`g.next`，执行流在原来挂起的地方继续执行，此时函数的参数、变量都保存着上一次执行的状态和值，就好像函数从未挂起或跳出过。

### 一个经典的例子

引用[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/1.7#Generators)上的一个示例：斐波那契数列的生成。

```javascript
  function do_callback(num) {
    console.log(num);
  }

  function fib(done) {
    var i = 0, j = 1, n = 0;
    while (n < 10) {
      done(i);
      var t = i;
      i = j;
      j += t;
      n++;
    }
  }

  fib(do_callback);
```

以上代码与MDN上实现的稍有不同，但意思是一样的：每次迭代的值都会传给一个回调函数。
这样看起来很正常，会打印出数列的前10个数字。

一个更好的实现：

```javascript
  function *fib() {
    var i = 0, j = 1;
    while (true) {
      yield i;
      var t = i;
      i = j;
      j += t;
    }
  }

  var g = fib();
  for (var i = 0; i < 10; i++) {
    console.log(g.next().value);
  }
```

为什么是更好的实现？我有两个理由：

1、执行流更清晰。我们的最终目的是要打印出数列，而`fib`只是在这个过程中的一个子过程。

2、更加灵活。通过`Generator`，我们可以随时继续或停止数列的生成。而第一种方式，则需要给`fib`函数增加一个参数以标识所需生成的数列长度，增加了
代码的复杂性。

### 还有什么？

在[规范](http://wiki.ecmascript.org/doku.php?id=harmony:generators)里，一个`Generator Object`有4个属性：
`send`、`next`、`throw`、`close`。`next`相信大家已经很熟了，下面我们就来八一八其他3个属性。

#### .send()

`send`方法允许指定一个值，作为上一次`yield`的返回值。啥意思呢？

```javascript
  function *gen() {
    var x = yield 1;
    yield x;
  }

  var g = gen();
  console.log(g.next().value);  // 1
  console.log(g.send(2).value); // 2, not 1!

```

*需要注意的是，这段代码在node v0.11.9下跑不通，因为v8并没有实现[send方法](http://stackoverflow.com/questions/20890031/restarting-a-generator-in-javascript)，但是通过调用`next`方法可以实现一样的效果*

```javascript
  // node 下可以用`next`方法代替`send`

  function *gen() {
    var x = yield 1;
    yield x;
  }

  var g = gen();
  console.log(g.next().value);  // 1
  console.log(g.next(2).value); // 2, not 1!

```

#### .throw()

`throw`方法其实和我们熟知的javascript异常抛错是一样的。

```
  function *gen() {}

  try {
    var g = gen();
    g.throw('I got you!');
  } catch(e) {
    console.log(e);  // I got you!
  }
```

#### .close()

`close`方法在node下也没有实现，并且没有替代的方案。
根据[规范](http://wiki.ecmascript.org/doku.php?id=harmony:generators)的描述，调用`close`方法可以直接以当前的`value`作为`Generator`的返回值。
虽然容易理解，但是没有看到相关的范例，所以就给出示例代码了。

### 代理的玩法(delegating yield)

通过前面的一些例子，我们已经知道，调用`next`方法就可以得到相应的值，而这个相应的值就是`yield`后面的常量或表达式的值。
如果`yield`后面跟着的是一个`Generator Object`呢？

```javascript
  function *gen() {
    yield 1;
    yield 2;
    yield* gen2();
  }

  function *gen2() {
    yield 3;
    yield 4;
  }

  var g = gen();
  console.log(g.next()); // { value: 1, done: false }
  console.log(g.next()); // { value: 2, done: false }
  console.log(g.next()); // { value: 3, done: false }
  console.log(g.next()); // { value: 4, done: false }
  console.log(g.next()); // { value: undefined, done: true }
```

到现在，我们还是第一次碰到`yield*`。那么之前的问题的表述就有了问题，应该是`yield*`后面跟着一个`Generator Object`。
从代码里不难看出，`g.next`的返回值会被代理到`gen2().next`，直到`gen2`的迭代结束。这个特性和函数的嵌套调用很像，但`Generator`本身也是函数，不是吗？
真是“熟悉的陌生人”。

#### node下怎么玩？

#### 走正门

要使用`Generator`特性，需要：

1、Node版本>=0.11.9

2、启用`harmony`选项：`node --harmony` or `node --harmony_generators`

#### 走偏门

如果你的node环境不满足“走正门”的条件，可以使用`gnode`模块：

1、在你的项目中`npm install gnode`。

2、在入口文件（例如：`index.js`）添加如下代码：

```javascript
  // require hack
  require('gnode');
  
  // go on
  require('lib/app.js');
```

*注意：入口文件不应包含`Generator`的相关定义，否则在预解析阶段就会报错，把代码逻辑移到另外的文件（例如：app.js）中*

### To be continued...







