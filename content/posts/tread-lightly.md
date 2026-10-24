---
title: Tread Lightly
description: "An approach to building\_websites"
publishDate: '2017-02-25'
tags:
  - web-development
  - programming
  - application-architecture
  - software-development
source: Medium
originalUrl: 'https://medium.com/@level_out/tread-lightly-392541f34c92'
---

The concept of ‘treading lightly’ is designed for technical product teams within startups.

Treading lightly describes an approach to product development whereby implementations are made on the smallest possible scale without over-commitment to a single technology or methodology in order to facilitate future enhancement.

By treading lightly, the focus remains on the product and the entire tech stack becomes an implementation detail.

### Innovate now without restricting future opportunities

The fast pace of change inherent to early-stage products requires technical teams to be **prepared for product changes** and the fluctuating nature of technology trends requires them to be **open to implementation changes**. By treading lightly when building product features, iterations can be made constantly and rapidly and changes to architecture and tooling can be made without restraint.

To borrow from Postel’s law: technical teams should liberally accept feature requests but develop conservatively, fostering innovation whilst adding features in a harmonious fashion with minimal code and upheaval.

Treading lightly is really an amalgamation of ideas and experiences. Let’s dive in!

![](/images/tread-lightly/1.jpg)

_‘The Red Model’, 1934 by Rene Magritte_

### Resilient Web Design

The whole of this book by [Jeremy Keith](https://medium.com/u/5271293d8452) is essential reading for anybody who goes near the Internet. Jeremy’s ability to distill the essence of designing and developing for the web is wonderful.

[Resilient Web Design](https://resilientwebdesign.com/)

Two key themes that run throughout the book are: use your tools correctly and start with the basics before enhancing. Jeremy points to the GOV.UK team’s two-step design process:

> First, just make it work; second, make it work better.

For product innovation to thrive implementations must be kept basic and minimal. This doesn’t translate to a lack of features, quite the opposite: by maintaining lightness progress becomes constant.

### Evolutionary Architecture

Neal Ford and Rebecca Parsons from [ThoughtWorks](https://medium.com/u/8075bdd73dd9) coined the term [Evolutionary Architecture](https://www.thoughtworks.com/insights/blog/microservices-evolutionary-architecture) in 2016. With an evolutionary approach, change becomes a first-class citizen. Neal and Rebecca cite microservices and Domain Driven Design as prime examples of this concept.

This level of separation can be difficult when applied to client-side web development particularly with JavaScript frameworks and CSS in general. Everything is much more naturally coupled. Nevertheless, the same approach can be applied with careful planning and craft — [even to CSS](https://medium.com/@level_out/truly-reusable-css-f9399e66d40a#.yfc28fdjb).

You can hear more about evolutionary architecture on the [ThoughtWorks podcast](https://soundcloud.com/thoughtworks/thoughtworks-beacon-evolutionary-architecture-vo#t=13:43) but in the meantime here is an illuminating quote from that episode where Rebecca Parsons speaks about adaptability vs evolvability:

> When we think about adaptability the idea that is conjured up is oh I’ve got something that is flexible enough that I have all the right knobs to turn and all the right levers to pull because somehow I was smart enough to figure out in advance how all of these things were going to change. That just can’t happen anymore — maybe it could happen 30 or 40 years ago but the requirements that systems live in now — not just in technological change but expectations from users, the business. Fundamental business model lifetimes are even shrinking. And so rather than thinking we are able to predict how these things are going to change so I can build in the right knobs and levers, we need to make sure instead that we can make some of these fundamental changes safely and quickly. That’s why we are focussing on this phrase evolvability as opposed to adaptability.

### Incremental Adoption

[Lee Byron](https://medium.com/u/d9b1a61823fa)’s talk ‘Lessons from 4 Years of GraphQL’ deserves an honourable mention here too. Lee describes how GraphQL was incrementally adopted into Facebook products and this important lesson can be applied to adding features to our own products:

> Having this path for incremental adoption is critical for the proliferation of ideas because it lets you try out a new idea in the context of an existing application where things are already working. So you can evaluate the strengths and the weaknesses of this new piece of technology before making a decision to just go whole-hog and build with it everywhere.

[Embedded media](http://www.youtube.com/watch?v=zVNrqo9XGOs)

### Sacrificial Architecture

Martin Fowler’s concept of [sacrificial architecture](https://martinfowler.com/bliki/SacrificialArchitecture.html) may seem contradictory to the ideas of evolutionary architecture and incremental adoption but we may be able to find some use for it. Martin describes a practice of discarding product implementations frequently to keep pace with changing technology and business requirements, stating: “the best code you can write now is code you’ll discard in a couple of years time”. He tells the story of how eBay tore down their codebase at a rate of every 2–4 years:

> The right architecture to support 1996-eBay isn’t going to be the right architecture for 2006-eBay. The 1996 one won’t handle 2006’s load but the 2006 version is too complex to build, maintain, and evolve for the needs of 1996.

This echoes the Resilient mantra of using the right tool for the right job and using it correctly. Martin then goes on to make the interesting yet familiar point that, when you are implementing a product or feature, seldom are the business or engineers clear on its requirements:

> Often in the early period of a software system you’re less sure of what it really needs to do, so it’s important to put more focus on flexibility for changing features rather than performance or availability.

Sacrificial architecture can also be applied to MVPs and prototypes:

> You can also apply this principle to features within an existing system. If you’re building a new feature it’s often wise to make it available to only a subset of your users, so you can get feedback on whether it’s a good idea. To do that you may initially build it in a sacrificial way, so that you don’t invest the full effort on a feature that you find isn’t worth full deployment.

If you haven’t come across [Emma Coat’s 22 #storybasics](http://storyshots.tumblr.com/post/25032057278/22-storybasics-ive-picked-up-in-my-time-at-pixar) they are definitely worth a read for anyone with creative pursuits. One in particular comes to mind when considering the merits of sacrificial architecture:

> #3 Trying for theme is important, but you won’t see what the story is actually about til you’re at the end of it. Now rewrite.

Write. Now rewrite.

### Clean Code

When treading lightly, it is paramount that all code written is consistent and maintainable. Without well-structured code, future iterations and refactoring become so much harder. Here are some good resources for writing such code:

-   [https://github.com/ryanmcdermott/clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript)
-   [https://webpro.github.io/programming-principles/](https://webpro.github.io/programming-principles/)
-   [https://www.quora.com/Which-core-programming-principles-apply-to-all-languages](https://www.quora.com/Which-core-programming-principles-apply-to-all-languages)
-   [https://github.com/braydie/HowToBeAProgrammer](https://github.com/braydie/HowToBeAProgrammer)

### Be a light treader

A real privilege of working in such a relatively young industry is the scope for change and the opportunity to be a part of shaping that change. A young company can be the perfect place to practice this discipline; the chance of a blank canvas to try out the latest tools and techniques. But there is no reason that innovation and experimentation should be restricted to the initiation of a product or company. And no reason that today’s innovation should restrict the possibility of future innovation. We should be able to continually innovate and experiment and enjoy it too! By implementing our ideas smartly and lightly we can build evolvable, resilient products.
