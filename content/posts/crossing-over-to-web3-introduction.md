---
title: Crossing Over to Web3 – 01 An Introduction to Decentralised Development
description: "Issue #1 in the definitive developer’s guide for the journey from web2 to\_web3"
publishDate: '2017-10-12'
tags:
  - developer
  - web3
  - blockchain
  - ethereum
  - dapps
source: JAAK
originalUrl: >-
  https://medium.com/jaak-io/crossing-over-to-web3-an-introduction-to-decentralised-development-53de470da331
---

#### 👋

_Welcome to the first in a series of blog posts that aims to get web developers building decentralised applications and smart contracts on Ethereum in the_ **_simplest way possible_**_._

_We’ll work through an example project and look at how to build, test, secure and deploy decentralised applications backed by smart contracts on the Ethereum blockchain._

#### What’s the series about?

In January 2017, on a routine web surf for the latest craze, I came across this weird thing called Ethereum. My mind could not understand much of what it read but my “cool shit” sense was ringing off the hook.

By March 2017, I began to comprehend this mythical decentralised Nirvana and took a job at [JAAK](https://jaak.io/) to work on [transitioning the music industry onto this new stack](https://blog.jaak.io/the-meta-network-lowering-the-barriers-for-developers-in-the-music-industry-b0a0431c3528). Two things have become apparent in the past six months:

1.  There are plenty of complex tutorials and bad advice out there
2.  There is a scarcity of quality web developers necessary to advance the ecosystem

My motivation for writing this series is clear: decentralisation holds huge potential for the web and beyond. By lowering the barrier to entry, the ecosystem can be filled with developers, causing a proliferation of innovative ideas, rapid iteration of tools and high-quality products.

> Dapp developers: What do you consider to be the hardest part about building decentralised applications on Ethereum today? 🏗️🛠️
>
> — Luke Hedger on Twitter

#### So who is it for?

If you’re a web/JavaScript developer who has heard the hype of a decentralised future and wants to actively learn how to build on web3 architecture this is for you. Also, anyone who has been confused by existing tutorials or Truffle/Meteor boilerplates and is looking for a simpler entry point.

#### Before diving in, let’s start with some definitions

Most tutorials conflate a lot of disparate terms and try to teach prospective web3 developers the intricacies of crypto-economics alongside what [Vitalik](https://twitter.com/VitalikButerin) likes for breakfast. This series won’t cover any of that.

It’s crucial to distinguish between levels of the stack to build up a clear idea of each part’s roles and mechanics. This way developers can avoid getting lost in the speculation and start to see where their applications can utilise this stack.

**Web3**

Web3 generally refers to the next generation of the worldwide web. It has been adopted by the Ethereum ecosystem and co-opted to refer to a decentralised web. Put simply then, web3 is web2 without the centralised servers and data silos. If everything goes to plan, web3 will just become part of the web and web3 developers will become web developers again.

In time, decentralised architecture will simply become an infrastructure choice, just like MongoDB vs Firebase or REST vs GraphQL is today — your EC2 instance might be replaced by Ethereum and your static assets could be stored on [Swarm](http://swarm-gateways.net/bzz:/theswarm.eth/).

> The changeover will be gradual, on Web 2.0, we’ll increasingly see sites whose back-ends utilise Web 3.0-like components such as Bitcoin, BitTorrent, NameCoin. This trend will continue and the truly Web-3.0 platform Ethereum will likely be used by sites that wish to provide transactional evidence of their content e.g. voting sites and exchanges.

[_http://gavwood.com/web3lt.html_](http://gavwood.com/web3lt.html) _(23 April 2014)_

**Dapp**

A dapp is a decentralised app. For us old school web developers this can be hard to grasp: [there is no server](http://matrix.wikia.com/wiki/Spoon_Boy). Instead, “backend” code runs on a decentralised peer-to-peer network of nodes and “frontend” code is served from a distributed CDN.

![](/images/crossing-over-to-web3-introduction/1.png)

_Web2 → Web3_

**Blockchain**

You can think of a blockchain as an append-only database that, rather than being stored on a single server, is distributed amongst a network of nodes that each store the entire transaction history of the network.

As the name suggests, a blockchain is an immutable record (chain) of data packets (blocks), which contain a set of operations that document some particular action associated with the blockchain (transactions).

In the Bitcoin blockchain, these transactions are purely financial (X sent Y N Bitcoins). In the Ethereum blockchain, it is possible to execute a variety of transaction types through the use of programs containing rules for processing a transaction (Smart Contracts).

[Lauri Hartikka](https://medium.com/@lhartikk?source=user_popover) wrote a great post about a [minimal implementation of a blockchain](https://medium.com/@lhartikk/a-blockchain-in-200-lines-of-code-963cc1cc0e54) that describes the raw mechanics.

**Ethereum**

[Ethereum](https://ethereum.org/) is a blockchain-based, distributed computing platform that provides scripting functionality through smart contracts. Dapps can utilise Ethereum and associated technologies and we’ll focus on it for this series.

However, note that it is not an essential requirement: BitTorrent, Popcorn Time and Tor are all examples of decentralised applications that do not use Ethereum.

**Smart Contract**

Smart contracts in the context of Ethereum are scripts that are executed on a global network of public nodes — the EVM (Ethereum Virtual Machine) — and can read/write transactions from/to the blockchain. Smart contracts can be thought of as decentralised computation for a dapp; serving a similar role to an HTTP API interacting with a datastore, just not on centralised servers.

It is important to distinguish between dapps and smart contracts: indeed, interfacing with data and services via contracts can be a big part of a dapp but, just as you can have a static app, a dapp can have zero contract interfaces.

#### State of web3 development

The framework war raged for years in the JavaScript ecosystem and witnessed various attempts to conceal the nuances of web development. It has ended without a victorious framework — the truth is the prevalence and preference of modular libraries has won.

In the beginnings of the Web3 Age, there has been a [trend towards large](https://github.com/ethereum/wiki/wiki/Dapp-using-Meteor), [monolithic frameworks](http://truffleframework.com/). The temptation to lean on frameworks like Meteor and Truffle restricts the chance to learn about the primitives of web3 development and creates an unmaintainable project in the long-term.

In contrast, tools that automate complex, discrete and repetitive tasks related to working with dapps and smart contracts can promote good practice and lead to gentler learning curves.

There is also an emerging danger that, in the pursuit of a “new Internet”, recent advancements and techniques get lost when discarding the bad parts of Web 2.0. Currently in the web3 ecosystem, a regression in library authoring and frontend architectural patterns can be observed far too often.

#### Building a web3 project

There are two pillars to a web3 project setup: [Web3.js](http://web3js.readthedocs.io/en/1.0/) (a dapp’s gateway to the Ethereum blockchain and smart contracts) and [TestRPC](https://github.com/ethereumjs/testrpc) (your local Ethereum blockchain). Web3.js is the most advanced Ethereum JS library out there and TestRPC is currently the simplest way to get a local node running.

This guide and accompanying code will utilise both Web3.js and TestRPC along with the simplest tools available to minimise cognitive load. We’ll start building out an example project in the coming posts but let loose with any questions or observations in the comments or chat with JAAK and other web3 developers on [the META Network Slack channel](https://community.meta-network.io/) 💬.

#### Next time…

We’ll cover how to design, write, secure and deploy smart contracts [(click here)](https://blog.jaak.io/crossing-over-to-web3-smart-contracts-3a295e35e5c0).

#### Some further reading

-   📔 [Good glossary to keep handy](https://github.com/ethereum/wiki/blob/master/Glossary.md)
-   🤑 [Nice intro to crypto-economics](https://thecontrol.co/cryptoeconomics-101-e5c883e9a8ff)
-   3️⃣ [Three blockchain benefits](https://blog.bigchaindb.com/three-blockchain-benefits-ae3a2a5ab102)
-   🏭 [How does Ethereum work, anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)

#### Project Update

An awesome by-product of projects run by people passionate about decentralised applications is the vast majority of the code is open source. This makes for a great opportunity to dig around in repos for inspiration and best practice — not to mention contributions!

Here at JAAK we are building the [META Network and protocol](https://github.com/meta-network/docs) and are currently [piloting both in a private alpha](https://cointelegraph.com/news/jaak-announces-meta-decentralized-network-backed-by-ethereum-and-swarm), populating the network with data from our industry partners. Take a [look at our code](https://github.com/meta-network) and jump into our [Slack channel](https://community.meta-network.io/) to chat about anything you find!

#### Find [us](http://jaak.io) on [Twitter](https://twitter.com/jaak_io) and [Facebook](https://www.facebook.com/JAAK.io/).
