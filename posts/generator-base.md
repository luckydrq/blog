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
有疑问请猛拍。

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
  var g = new gen();

  console.log(typeof g);  // object
```

上面的`g`就是`Generator`，很明显，它是一个`Object`。因此，`Generator`也经常被称为`Generator Object`。

这样就清楚多了，`GeneratorFunction`就是`Generator`的构造器！






