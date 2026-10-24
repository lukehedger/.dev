---
title: Divshot (to the face)
description: >-
  It's coming. No doubt about it. I can hear the sound of inevitability from
  here. But the real question is could you still deploy a static website during
  the Zombie Apocalypse?
publishDate: '2014-09-04'
tags:
  - hosting
source: level-out.com
---

I recently put my first [Divshot](http://www.divshot.com/) site live. Shortly after that, in a completely unrelated experience - or so I though at the time - I watched [World War Z](http://www.worldwarzmovie.com/). In the days that followed I began to wonder whether a site could be deployed during the zombie apocalypse and how long it might last.

### A Divshot in the dark

If you haven't come across Divshot before it is a [static website](http://www.staticapps.org/) hosting platform and has some awesome features like CLI deployment, multiple hosting environments and [great support](https://twitter.com/divshot/status/495491565368795138). Turns out these are all really useful in a zombie-ridden world as well as the real one...

### Command Line In-your-face deployment

Deploying with Divshot is fast. Super-fast. You're going to need this in your locker when faced with an army of undead to warn the world of impending doom. Assumming you've got your static zombie-proof site already setup, you can deploy with `divshot push` straight from the command line. [This post](http://www.divshot.com/blog/product-updates/faster-deploys/) about faster deployment took **3.7 seconds** to deploy.

### Safe environments

It's all well and good having a rapid deployment strategy but how will you know that the apocalypse has started? Sure, if it all kicks-off at the end of your street you'll know it's time to push your zombie warning live but if it starts in downtown New York you're going to need a nudge. I've created a [recipe](https://ifttt.com/recipes/201061-zombie-alert) on [IFTTT](http://ift.tt/) that checks the New York Times for articles containing the word "zombie" and sends a notification to my Android phone. Now, when I see this alert, I'll know it's time.

I can also leverage the immense popularity of my current Divshot app to ensure maximum reach of my zombie warning by storing it on the `staging` environment and executing `divshot promote staging production` when the alert comes through.

### Survival of the biggest (network)

So, you're one step ahead of the zombies and you've deployed your static website warning the world about the apocalypse but how long will it survive? According to the [Divshot features page](http://www.divshot.com/features) they have *"a global network of edge servers spanning over 90 countries"*. According to [this trustworthy source](http://geography.about.com/od/lists/a/averagecountry.htm), the average population of a country is 34,020,600.

`34,020,600 * 90 = 3,061,854,000`

Based on [this scientific model](http://www.empireonline.com/features/world-war-z-science) it would take just over a week for those 90 countries to be conquered. I imagine the Divshot servers wouldn't last too much longer.

And there you have it: a bulletproof plan for warning the world about the Zombie Apocalypse. If you've got any other ideas on how our web apps can survive the zombie apocalypse leave a comment!
