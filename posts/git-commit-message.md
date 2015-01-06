---
title: 配置git的commit_message模板
date: '2014-12-04'
permalink: /2014-12-04/git-commit-message
categories:
- tools
tags:
- git
---

我们平时用`git`或`svn`提交代码的时候，`commit message`都是跟在`-m`后面直接在命令行里打出来，这样确实很方便。但是，当我们参与大型或者正式的多人合作的项目时，在版本管理或分支策略上会有一些标准规范，其中可能也会包括对`commit message`进行规范。例如，我在做[哥伦布](http://gitlab.alibaba-inc.com/icbu-node/columbus)的时候，项目组就制定了一些[规范](http://gitlab.alibaba-inc.com/icbu-node/columbus/issues/37)。具体来说，比如`commit message`的格式要求如下：

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```
看起来很专业，但格式有点复杂，还要记住`type`，`scope`，`body`，`footer`都是干什么用的，具体有哪些值，实施起来有点抵触心理。于是就想，最好每次提交的时候都能看到这些东西，这样就能参考着写了，也不需要花太多精力去记忆。经过google，发现可以配置`message template`。步骤如下：

- 配置默认编辑器，以macvim为例：`git config --global core.editor "mvim -f"`。*注意：mvim 一定要带上`-f`标志。*
- 把`message template`放在一个文件里，例如`$HOME/.gitmessage`。配置`git commit`时读取该文件作为模板：`git config --global commit.template $HOME/.gitmessage`。
- `$HOME/.gitmessage`所有内容行以`#`开头，这是注释，提交时会被`git`忽略。以上面提及的规范为例，文件内容如下：

```
# https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit-message-format
#
# Format:
#
# <type>(<scope>): <subject>
# <BLANK LINE>
# <body>
# <BLANK LINE>
# <footer>
#
# Type:
#
# feat: A new feature
# fix: A buf fix
# docs: Documentation only changes
# style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
# refactor: A code change that neither fixes a bug or adds a feature
# perf: A code change that improves performance
# test: Adding missing tests
# chore: Changes to the build process or auxiliary tools and libraries such as documentation generation
#
# Scope:
#
# The scope could be anything specifying place of the commit change.
#
# Body:
#
# Just as in the subject, use the imperative, present tense: "change" not "changed" nor "changes" The body should include the motivation for the change and contrast this with previous behavior.
#
# Footer:
#
# The footer should contain any information about Breaking Changes and is also the place to reference GitHub issues that this commit Closes.

```
根据实际情况，你可以增加详尽的注释。

全文完。
