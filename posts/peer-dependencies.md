---
title: Peer dependencies
date: '2014-10-23'
description:
permalink: /2014-10-23/peer-dependencies
categories:
- js
tags:
- node
---

众所周知，nodejs通过包管理工具`npm`来解决包之间的依赖问题。对此，大家最熟悉的可能就是`package.json`文件的`dependencies`和`devDependencies`两个字段：

- dependencies：当前包强依赖的三方包（没有它们就不能work了）
- devDependencies：当前包开发或者测试依赖的三方包（没有它们也能work）

今天就来解析下另外一个字段：`peerDependencies`。

## 通常情况

先来看一个普通的例子：我的包依赖`a@2.0.0`和`b@1.2.3`两个包，而`b@1.2.3`又依赖`a@1.0.0`，那么最终的依赖关系是这样的：

```
├── a@2.0.0
├── b@1.2.3
│   ├── a@1.0.0
```

`npm`可以很好地解决上述问题，`a@1.0.0`只供`b`使用，不会影响到`a@2.0.0`。

## 问题场景

`npm`生态里有一些包是用作`插件(plugins)`的，它们的运行依赖`宿主(host package)`。例如，`grunt-contrib-uglify`和`grunt`就是插件和宿主的关系。

以下罗列了一些常见的插件体系：

- [Grunt plugins](http://gruntjs.com/#plugins-all)
- [Chai plugins](http://chaijs.com/plugins)
- [LevelUP plugins](https://github.com/rvagg/node-levelup/wiki/Modules)
- [Express middleware](http://expressjs.com/api.html#middleware)
- [Winston transports](https://github.com/flatiron/winston/blob/master/docs/transports.md)

通常情况下，插件是基于宿主的某个特定版本之上设计与开发的，而大多数插件本身并不依赖宿主（以grunt插件为例，它们的代码里不会`require('grunt')`，`dependencies`字段里也不会写上`grunt`包依赖）。这样就会导致插件A依赖的宿主版本与插件B依赖的宿主版本不一致。

即使插件对宿主有强依赖，例如：

```
├── winston@0.6.2
├── winston-mail@0.2.3
│   ├── winston@0.5.11
```

宿主包因为版本差异导致的API差异，仍然可能导致问题。

## peerDependencies

在插件的`package.json`里加入`peerDependencies`描述，就好像在说“我只能在宿主1.2.x版本之上正常工作，如果要安装我，请务必确认宿主的版本兼容性”。如果插件A和插件B指定的宿主版本造成了冲突（这里的冲突不是指`patch`版本冲突，而是`major`或者`minor`的版本，具体的验证逻辑没有详细考证，详见[semver](http://semver.org/)），npm 会报错提示。

以下是`grunt-contrib-uglify`插件的包描述的一部分：

```
"dependencies": {
   "chalk": "^0.5.1",
   "lodash": "^2.4.1",
   "maxmin": "^1.0.0",
   "uglify-js": "^2.4.0",
   "uri-path": "0.0.2"
},

...

"peerDependencies": {
  "grunt": "~0.4.0"
}
```

当`npm install grunt-contrib-uglify`时，`grunt`也会被安装：

```
├── grunt
├── grunt-contrib-uglify
```

`grunt`与`grunt-contrib-uglify`目录是平级的。

**需要注意的是，`peerDependencies`不应规定得太死。例如，不应`grunt: "0.4.1"`，而应该`grunt: 0.4.x`或者`grunt: ~0.4.0`，这样提供了更多的包容性，毕竟很多插件开发者都懒得搞清楚兼容的最低宿主版本。**
