---
title: "Square of Balance"
description: "Balancing delivery speed and application stability for maximum reliability"
publishDate: "29 April 2026"
tags: ["serverless"]
---

The **Square of Balance** is a framework for shipping reliable software at scale. It balances delivery speed against application stability by spreading engineering effort across four activities: **deliver, test, observe and recover**.

The principle is simple. If you can't catch a bug before release, catch it after. If you can't catch it after, recover from it.

![The four quadrants of the Square of Balance: Test, Observe, Recover, Deliver](/images/square-of-balance.png)

I developed the framework in 2021. The team I was leading was stuck. Delivery times were escalating, our end-to-end tests were flaky and we shipped disastrous big-bang deployments every three weeks. We were building a managed distributed system but not using its properties to our advantage. Everything had to change.

## Bugs are inevitable

> Testing can be used very effectively to show the presence of bugs but never to show their absence.
>
> ~ [E.W. Dijkstra](https://www.cs.utexas.edu/~EWD/transcriptions/EWD03xx/EWD303.html)

Once you accept that bugs are inevitable you can approach delivery and stability in a fresh way. Testing distributed systems is hard. Even those who won't admit bugs are inevitable agree on that.

So why insist on doing it the hard way?

Testing the integration between two or more components in a distributed system relies on deployed resources, synthetic traffic and complex assertions. These tests are expensive to write, expensive to run and expensive to maintain. The return on investment slips year over year and the suite gets flakier.

## Confidence over coverage

You are aiming for confidence to ship, not exhaustive test coverage. Swap test coverage for delivery speed. Cover async paths with recovery. Cover critical sync paths with observation.

Instead of an expensive, complex and flaky integration test, optimise the integration for recovery and observability. The suite gets smaller. Delivery gets faster. Stability holds, because the safety net has moved to where it actually catches things: production.

Crucially, the four activities are not interchangeable. Pick the wrong one for a given path and you either over-invest in tests that don't catch the failures that hurt or under-invest in recovery for failures your users will see anyway.

---

The full guide to the Square of Balance is in Chapter 7 of [Serverless Development on AWS](https://level-out.com/book/) (O'Reilly, 2024).
