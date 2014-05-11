---
title: git hook在项目里的简单应用
date: '2013-08-10'
description:
permalink: /2013-08-10/git-hook
categories:
- tools
tags:
- git
---

上一篇关于```git```的博文扯到了```git hook```，一直想用它搞点实用的事情出来，正好最近的项目处于预发布之前的最后测试阶段，页面上的css文件地址换成了cdn地址，这样带来的麻烦就是如果css要修改，必须要重新发布到cdn上。为了偷懒，就想每次git commit成功后执行hook脚本自动完成发布cdn的事情。

关于```git hook```，网上有一大堆介绍，可以看看<a href="http://blog.jobbole.com/26131/" target="_blank">这里</a>。总得说来，```git hook```可以分为客户端```hook```和服务器端```hook```。客户端```hook```用于客户端的操作，如提交和合并。服务器端```hook```用于git服务器端的操作，如接收被推送的提交。在```git```操作周期的不同阶段，会触发相应的```hook```（如果你写了）。所有的这些脚本，都存放在你的工程的```Git```目录下，具体路径为```.git/hooks/```。执行```ls .git/hooks```查看一下，会发现有很多以```.sample```结尾的文件，再看看这些文件内容，全都是shell脚本。这些文件是```git```为你预置的一些```hook```脚本，只要把文件的后缀名```.sample```去掉，脚本就生效了。

这里面的大多数```hook```我都没有用过，就只说说项目里的用法。经过尝试，最终选用了```commit-msg```和```post-commit```这两个客户端```hook```。这里可能有人要问，不就是发个cdn么，这么屁大点事还要用两个脚本？对于这里的逻辑，我认为是这样的：1、只有当本次提交涉及修改的文件里包括我想要的css文件时，才能发布cdn。2、只有当提交操作完成（即commit成功），再做发布cdn的操作。经过试验发现，在提交操作完成后，找不到合适的办法获取本次提交的修改文件列表，这样就无法知道本次提交是否涉及css文件。这里可能又有人会说，干脆么每次提交都整一次发布好了哇。可以是可以，但是有点不爽啊。。。```commit-msg```是在提交之前调用的，如果脚本返回非零的值，那么本次提交将会被取消。```post-commit```是在提交之后调用的，如果提交不成功，那么它就不会执行。对于检测是否存在目标的css文件，我用了比较土的办法，在```commit-msg```脚本里，检查修改文件里是否存在目标文件，如果存在，就创建一个空文件A。提交完成后，在```post-commit```里检查空文件A是否存在，如果存在，就执行发布cdn操作。下面就把代码贴出来：

`commit-msg`:

```
#!/bin/sh
files=`git diff --cached --name-only`
EXTRA_File="$EXTRA$"

if [ -f $EXTRA_File ]; then
  rm $EXTRA_File
fi

for file in $files; do
  #echo $file

  if [ "$file" == "public/index.css" ]; then
    touch $EXTRA_File
    break
  fi
done
```

`post-commit`:

```
#!/bin/sh
EXTRA_File="$EXTRA$"

if [ -f $EXTRA_File ]; then
  cd ~/workspace/mosaic-demo/public/mm
  sh deploy.sh
  rm $EXTRA_File
fi
```

`deploy.sh`封装了css压缩、上传cdn的操作，也就是你想要做的操作，也贴出来走完整个流程。不过主要就是上面的两段脚本，很简单吧！如果有朋友有更好的办法，欢迎拍砖！！！

`deploy.sh`:

```
#!/bin/sh
cp ../index.css ./build/index.css
cd ../../
grunt
cd public/mm
echo 'uploading css to cdn...'
node deploy.js
echo 'uploading success!'
```
