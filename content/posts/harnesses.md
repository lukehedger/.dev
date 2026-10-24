---
title: harnesses
description: don’t put all your yegges in one basket
publishDate: '2026-08-15'
tags: []
source: pckt
originalUrl: 'https://lsh.pckt.blog/harnesses-ga3655y'
---

If you haven’t read the latest ramblemusings from AI thoughtleader Steve Yegge you should.

As Steve himself says “_I am not special_. I'm just ahead of you. My actual work is _just like _everyone else's work. You are going to run into these exact problems, very soon, and you will retrace all my steps here”.

His writing style can feel impenetrable but try this:

- skim read right to the end
- stop and do something else for a day
- re-read the section that resonated most
- work backwards and forwards from there

The writing-style forcefield he puts up around his ideas will start to fade away and you’ll find some real gems in there.

I don’t think his ideas are necessarily novel (whose are?) but he’s one of those technical writers with a knack for distillation and capturing the future direction of software. These writers can pinpoint the thing that a lot of other visionaries are absolutely certain about but struggle to describe.

So, read the post, let it stew and if you want my take on it, here you go…

---

## The headlines:

- The models will continue to yield step changes that rip up the rulebook
- I don’t think we will all be building civilisations in year
- You should start building your own harness now
- CD is dead
- Human code review died a while ago

Let me expand on these points.

## Harnesses

The underlying message of the article is: don’t put all your eggs in one basket. In other words, don’t build and optimise your workflows and tools around a model or tool.

Yegge built Gas Town for Opus 4.6 and it fell apart with Opus 4.7. His new Wheelhouse is designed with Fable 5. But the next generation of models will bring another unexpected step change that’ll tear up the rulebook again.

Instead, you should build your own _harness_ around the agents and models. Take control of the harness, make it agent-agnostic, so your dependency is solely on the models.

The harness is the thing that runs the loops and orchestrates the agents. It should be built in a way that is abstracted from the power of the model, so if the model becomes more powerful it shouldn’t completely break the harness.

You might need to add new features to the harness. Maybe loops become redundant at some point - okay well strip out loops and replace it with something new: super loops.

I’m not sure we’ll be building cities and civilisations within the year but let’s see…

## CD is dead

Merge a change, build goes green, ship, monitor. If production breaks you’ll know exactly which release broke it and can immediately focus triage efforts on the right place.

With a rapid release pipeline (~10 mins or less), this works when you are releasing between, say, 10-50 times a day. But once your agents are working efficiently and you are releasing 100s of times a day, CD is going to be your bottleneck.

At this scale you cannot wait 10 minutes to ship every change - there are not enough minutes in the day!

The answer is going to sound regressive but there’s a catch!

Instead of deploying every change that lands in main, you should deploy when the build is green AND either:

- a batch size of changes is reached
- a scheduled time is reached

For the batch size, pick a number based on your throughput that doesn’t cause a backlog. The schedule could be every hour, for example.

But now you’re back to searching for that old needle in the haystack again? This is true but the constraint that made that impractical has gone - humans are slow debuggers, agents are not!

It’s now safer than ever to ship bugs because the agent can find them and fix them before most of your users will notice.

CI is not dead. Tests are more vital than ever. Shift your focus from CD to making your systems observable and maintaining clear incident runbooks that agents can execute.

## Code review is long dead

If you’ve been using agents to build multiple significant features in a day, you’ve already hit the code review bottleneck.

Manual human review has shifted to automated, asynchronous agent reviews, continuously scanning for:

- bugs and regressions
- security vulnerabilities
- convention drift
- quality erosion
- documentation drift

What about knowledge sharing and understanding the code?

Capturing and interrogating business requirements and customer feedback is how you’ll understand what your system should be doing. Operating and observing your system in production is going to be the primary way of understanding its behaviour - what it is actually doing.

Your job is to steer the codebase to ensure these two things match as closely as possible! Sound familiar?

---

_Thanks for reading!_
