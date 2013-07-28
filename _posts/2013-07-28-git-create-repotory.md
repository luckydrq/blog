---
title: 创建基于本地协议的git服务器
pagetags:
- git
---

{% include style.html %}

<!--more-->
今天了解了下git挂钩（```git hook```），本想通过```Github```实践一下其中的服务器挂钩。后来经过Google发现，```Github```只提供所谓的```web hook```，即当你push代码至某个repository时，```Github```服务器会发一个POST请求到你所注册的url，本次push的相关信息会作为一个JSON串随请求一起发过去。这与我的需求不符，我想要git服务器在收到push通知后执行一些操作（本地操作或者网络操作）。
<!--more-->

于是，就想自己搭个git代码服务器。架设git服务器共有4种协议：本地协议、SSH协议、git协议、HTTP/S协议。今天就说说最简单的一种：本地协议。通俗地说，git服务器就是一个代码远程仓库。先来看下书上的一段文字：

>远程仓库通常只是一个裸仓库（bare repository）—— 即一个没有当前工作目录的仓库。因为该仓库只是一个合作媒介，所以不需要从硬盘上取出最新版本的快照；仓库里存放的仅仅是 Git 的数据。简单地说，裸仓库就是你工作目录中.git 子目录内的内容。

以上文字的意思就是，仓库必须是裸的。我们先从创建裸仓库开始：

{% highlight bash %}
$ cd ~
$ git init --bare gitLocal    //仓库目录：~/gitLocal
{% endhighlight %}

然后，我们创建并初始化一个代码目录，比如Test.git

{% highlight bash %}
$ cd gitLocal
$ git init --bare Test.git    //注意，这里我踩过坑，如果不加--bare参数，后续在push时会发生[remote rejected]错误
{% endhighlight %}

代码目录创建好后，我们就可以对远程仓库进行拉取和推送数据了。

{% highlight bash %}
$ cd ~
$ git clone ~/gitLocal/Test.git    //是不是和Github的git地址很像？
$ cd Test
$ touch 1.js
$ git add 1.js
$ git commit -m 'add a file'
$ git push origin master
{% endhighlight %}

这样就完成了一次提交。后面的工作就和操作```Github```的远程仓库没区别了。

