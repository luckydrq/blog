---
title: 计时攻击浅析
date: '2014-10-27'
permalink: /2014-10-27/timing-attack
categories:
- web security
---

今天在扒代码的时候看到有个cookie验证的[模块](https://github.com/expressjs/keygrip)，它的原理就是通过对cookie进行签名和验签。不过，其中有个小模块[scmp](https://github.com/freewil/scmp)引起了我的注意，经过google才知道“计时攻击”（Timing Attack）这么个东西，看来安全方面自己还有很多东西要补。

## 看代码

scmp模块代码很少，如下：

```
module.exports = function scmp(a, b) {
  a = String(a);
  b = String(b);
  if (a.length !== b.length) {
    return false;
  }
  var result = 0;
  for (var i = 0; i < a.length; ++i) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};
```

这就是个字符串比较的函数啊，有什么稀奇的。但仔细一看实现过程，是不是有点蛋疼？！直接`return a == b`不就行了。这里就要说下什么是计时攻击。

>计时攻击 属于旁路攻击的一种, 所谓旁路攻击就是通过对系统的物理学分析和实现方式分析, 而不是密码学分析或暴力破解, 来尝试破解密码学系统的行为.

## 怎么理解？

如果直接以`a == b`作为条件来判断，大多数实现会对字符串进行逐字节匹配，如果发现有不匹配的，则立刻返回`false`。这样，比较的快慢就与字符串的顺序匹配度成反比，直接结果反应在响应时间上（虽然这些都是微妙级的）。通过大量的数据采集，就有可能推测出推测出明文。

现在，你应该理解上面的代码为啥要这样写了。因为它对字符串的每个位都比较一遍，所以响应时间几乎是常量（constant-time）。这种比较方式在性能上也许有些损耗，但最大程度上杜绝计时攻击。

## 感想

这种攻击要得手的话，对时间的要求也太苛刻了吧，会受到很多因素干扰，感觉很不靠谱，哈哈。

### 参考文章

- [http://codahale.com/a-lesson-in-timing-attacks/](http://codahale.com/a-lesson-in-timing-attacks/)
- [https://ruby-china.org/topics/21380](https://ruby-china.org/topics/21380)
