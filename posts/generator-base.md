---
title: Generator基础篇
date: '2014-07-13'
permalink: /2014-07-13/generator-base
categories:
- js
tags:
- node
---

众所周知，[Generator](http://wiki.ecmascript.org/doku.php?id=harmony:generators)是`ES6`的新特性，通过`yield`关键字，可以让一个函数（执行流）挂起。本文由一些学习笔记并夹杂一点个人思考组成，若
有疑问请猛拍。(注：本文所有代码在V8-3.22.24.10下运行)

### GeneratorFunction和Generator

在搞清什么是Generator之前，先要搞清什么是GeneratorFunction。我们先来看一段代码：

```javascript
  var gen = function *(){
    // do something
  };

  console.log(typeof gen);           // function
  console.log(gen.constructor.name)  // GeneratorFunction
```

看了这段代码，你可能会感到困惑，`function *(){}`是什么东东？没错，这是`ES6`里`GeneratorFunction`的写法。在以上代码中，`gen`是一个`GeneratorFunction`实例，同时也是一个`Function`实例（`GeneratorFunction`最终也是`Function`的一个实例）。这里我们无需过多纠缠，只要知道`GeneratorFunction`是一种特殊的`function`就行了。

那`Generator`又是什么呢？还是看一段代码：

```javascript
  var gen = function *(){
    // do something
  };
  var g = new gen();  // or var g = gen();

  console.log(typeof g);  // object
```

上面的`g`就是`Generator`，很明显，它是一个`Object`对象。因此，`Generator`也称为`Generator Object`。

通过以上的代码，我们可以得出结论：`GeneratorFunction`就是`Generator`的构造器！

### Hello World

OK，依照国际惯例先来个`Hello World`：

```javascript
  function helloworld *() {
    yield 'Hello';
    yield 'World';
  }

  var g = helloworld();
  console.log(g.next());    // {value: 'Hello', done: false}
  console.log(g.next());    // {value: 'World', done: false}
  console.log(g.next());    // {value: undefined, done: true}
  console.log(g.next());    // Error: Generator has already finished
```

可能你已经注意到了，当调用`helloworld`函数时，它的函数体并没有执行，取而代之的是返回了一个`Generator`对象。当第一次调用`g`上的`next`方法时，`helloworld`函数体开始执行，直到遇到第一个`yield`语句，执行流挂起(suspend)，同时返回一个`Object`对象。这个对象有`value`和`done`两个key，`value`表示函数体内`yield`语句指定的值（'hello'），`done`是个布尔类型，表示函数体是否已经执行结束。当再次调用`g.next`时，执行流在挂起的地方继续执行，直到遇到第2个`yield`，依次类推。。经过2次调用`g.next`，函数体已经执行到了末尾，但此时处于挂起状态，还不能跳出，因此`done`的值仍是`false`。再次调用`next`方法，函数体才执行完毕。这里值得注意的是，每次调用`g.next`，执行流在原来挂起的地方继续执行，此时函数的参数、变量都保存着上一次执行的状态和值，就好像函数从未挂起或跳出。

### 一个经典的例子

引用[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/1.7#Generators)上的一个示例：斐波那契数列的生成。事实上有很多文章引用它，可能是因为它够经典吧！OK，我们先来打印斐波那契数列的前10个数字：

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

以上代码与MDN上实现的稍有不同，但意思是一样的：即每次迭代的值都会传给一个回调函数(callback routine)。这样就带来2个问题：

1、如果回调函数是异步的，保证输出的顺序就变得更为复杂。

2、目前`fib`只能产生10个数，如果需要动态地产生任意数目的数，就很难满足需求了。

我们再来看通过`Generator`如何实现：

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

由于`Generator`可以控制函数的执行流，上述的2个问题就迎刃而解了。在合适的时候，只要需要，`fib`函数可以产生任意数目的数字。











