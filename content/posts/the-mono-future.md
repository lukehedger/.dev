---
title: The Mono Future
description: ''
publishDate: '2019-08-16'
tags:
  - software-development
  - javascript
source: Medium
originalUrl: 'https://medium.com/@level_out/the-mono-future-1dacd4d495cd'
---

![](/images/the-mono-future/1.jpg)

_Photo by [Simon Ray](https://unsplash.com/@b0rn2thrive?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/search/photos/monopoly?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)_

What’s better than a set of tools for a single task? One tool for a single task. What’s better than one tool for a single task? No task.

This seems to be the pattern that is emerging in the software engineering ecosystem, amongst tools and SaaS platforms: either condensing sets of closely related tools down into a “mono toolchain” or replacing complex tasks with a brand new, simplified experience.

### The stereo present

The biggest problems facing software teams today are:

1.  **Bugs** — as Andrew Jackson of the American Go Association remarked in the [documentary](https://www.imdb.com/title/tt6700846/) about [AlphaGo](https://deepmind.com/research/case-studies/alphago-the-story-so-far): “If DeepMind has figured out how to write code that doesn’t have bugs, that is a bigger news story than AlphaGo.” Bugs are going nowhere but they can be reduced and mitigated.
2.  **Code complexity** — when writing large applications, every key stroke is a risk. If bugs are unavoidable then code complexity serves only to exacerbate the problem. The more code you need to write and maintain, the more likely bugs are to manifest. Not to mention the added overhead of grokking and updating the codebase.
3.  **Deployments** — the concept and associated workflow of CI/CD is broken. Teams expend so much energy on configuring artificial environments and data stores just to produce inaccurate test results and spuriously broken builds. It has become so far removed from the actual process of building and running software that it is no longer useful.

Given these problems, software teams must strive to decrease the amount of code they produce and reduce the steps and complexity around deploying code thus reducing time to fix bugs and the risk of them occurring in the first place.

Resilient and robust systems share a single mantra: the less moving parts a system has the less likely it is to break.

### Many tools → one tool

A lot of excess code is a product of boilerplate demanded by frameworks, techniques and platforms — either through configuration files or use of libraries in production code. It makes sense then to reduce the number of tools in use or to evaluate the usefulness of a tool based on the amount of configuration and boilerplate required.

We have certainly been through the age of “JavaScript Fatigue” and it seems the time has come for web developers to stop talking about this weariness with excessive tooling and to instead start tearing down some embedded ideas to see how things could be different.

We are seeing this in action with projects like [**Pika**](https://www.pikapkg.com/), which aims to create a single pipeline for generating “fast, modern packages” by grouping sets of code transformations (like Rollup, Babel, TypeScript and Web Assembly) into a plugin-based system, behind simpler abstractions. It offers solutions for [building](https://github.com/pikapkg/pack), [installing](https://github.com/pikapkg/web) and [serving](https://www.pika.dev/cdn) ES modules.

[**Rome**](https://threadreaderapp.com/thread/1108407803545214977.html) is probably the most extreme example in the wild at the moment. Sebastian McKenzie is attempting to realise his [original dream for Babel](https://twitter.com/sebmck/status/1063574500493557760) by creating a new “JavaScript toolchain”, which bundles all of the tools we’ve come to rely on when building modern JavaScript applications:

> It has a linter, bundler, compiler, formatter, testing framework, dependency manager, and more. All of these make sense as a single system, they’re all related.

### Complex task → new experience

A broader story in this shift from “many to one” is that of SaaS platforms and devtools. Many engineering teams these days consolidate operations and infrastructure within single platforms, like AWS or GCP. But the deeper trend here is toward higher levels of abstraction of these business-critical functions with product teams becoming less involved with running servers and managing persistence layers. The outsourcing of these low-level, high-expertise concerns has resulted in the growth of “devtools as a service”, which is fast becoming a massive market, including companies like [Flynn](https://flynn.io/about) and [ZEIT](https://zeit.co/about) — even GitHub with features like [Package Registry](https://github.com/features/package-registry) and [Actions](https://github.com/features/actions).

This trend is even more interesting when looked at alongside the on-going shift in software engineering role definitions: [design](http://bradfrost.com/blog/post/frontend-design-react-and-a-bridge-over-the-great-divide/), [frontend](https://css-tricks.com/the-great-divide/), [fullstack](https://twitter.com/holtbt/status/977419276251430912), [devops](https://levelup.gitconnected.com/why-kubernetes-will-disappear-10ffcfb39f01#fdb7) — all of these traditional roles are being redefined as remits blur amidst [advances in tooling](https://www.modulz.app/). Even our codebases are becoming more homogenous and consolidated with the rise in popularity of the “monorepo”. The goal, more than ever, is primarily to “ship software” — everything that is extraneous to this objective should (and will) be phased out.

[**Dark**](https://darklang.com/) (from the maker of CircleCI) is perhaps the most interesting project in the realm of turning complex tasks into [entirely new experiences](https://medium.com/darklang/the-design-of-dark-59f5d38e52d2):

> As soon as you write code in the Dark editor, it’s immediately deployed to production, ready to be enabled with a feature flag... a simple diff from your editor to our infrastructure.

The basic premise of Dark’s idea is to [condense continuous delivery pipelines into 50ms](https://medium.com/darklang/how-dark-deploys-code-in-50ms-771c6dd60671) by removing almost all of the steps involved in taking code from an IDE to a server, without sacrificing the benefits of CI.

They are also promoting the idea of using [feature flag-driven development](https://launchdarkly.com/blog/feature-flag-driven-development/), for building progressive yet stable applications, to feature flag _first_ development.

> Feature flags is our workhorse: replacing local dev environments, git branches, code deployment, and of course still providing the traditional use-case of slow, controlled roll-out of new code.

Another revolutionary project waging war on boilerplate is [**Waxosuit**](https://medium.com/@KevinHoffman/introducing-waxosuit-6ad754b48ed9). Still in development, it is “designed to securely bind cloud native capabilities to WebAssembly modules.” Waxosuit aims to abstract a host of tasks away from engineers into a single interface:

> I didn’t want my development teams to have to re-write, copy/paste, or cargo cult stale implementations of NFRs for things like logging, tracing, contextual tracing (e.g. OpenTracing/Jaeger), Application Performance Monitoring (APM), health checking (e.g. live/readiness probes), message broker client wrappers, key-value store client wrappers, HTTP server endpoint wrappers, and so on.

One final honourable mention here is **Prisma**, who are working on abstracting complexity from the [database management workflow](https://www.prisma.io/blog/announcing-prisma-2-zq1s745db8i5):

> Developers typically use a mix of existing and custom/handwritten database tools for their every day database worfklows. Prisma unifies the main database workflows in a coherent ecosystem to make developers more productive.

### Mono all the things

One immediate concern of this consolidation might be “lock-in” — the more you rely on a single tool or platform to power your software, the harder it is to replace this with an alternative.

The problem of provider lock-in is definitely a risk but the paradigm is slightly different here. We are not really talking about “one tool to rule them all”; the innovation here is more about how to reduce the number of steps and, by extension, tools needed to build and ship software.

The true moral of this story is to challenge some of the assumed components of the software engineering lifecycle. Let’s see if there are innovative ways to yield meaningful gains in the process of building software.
