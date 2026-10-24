---
title: Crossing Over to Web3–03 Decentralised Applications
description: "Issue #3 of the definitive developer’s guide for the journey from web2 to\_web3"
publishDate: '2018-03-27'
tags:
  - dapps
  - ethereum
  - web3
  - development
  - blockchain
source: JAAK
originalUrl: >-
  https://medium.com/jaak-io/crossing-over-to-web3-03-decentralised-applications-20d56f4819d7
---

#### 🖖

_Welcome back to the series of blog posts that aims to get web developers building decentralised applications and smart contracts on Ethereum in the_ **_simplest way possible_**_._

_If you’ve just tuned in, you can read the first issue for_ [_an introduction to decentralised web development_](https://blog.jaak.io/crossing-over-to-web3-an-introduction-to-decentralised-development-53de470da331) _and the second issue for_ [_a guide to Ethereum smart contracts_](https://blog.jaak.io/crossing-over-to-web3-smart-contracts-3a295e35e5c0)_. This third issue will be all about building decentralised applications that interact with smart contracts._

### What is a decentralised application?

A decentralised application, or dapp, is a web app that runs **without any centralised architecture**. In a dapp technology stack, centralised servers and databases are replaced with smart contracts, distributed CDNs and blockchains.

As with centralised apps (or capps — just kidding), there are many different flavours of dapp and it is currently common to use a **hybrid approach** where smart contracts are used alongside traditional servers for some computation and hosting whilst the technology matures.

There are also [many ways to say ‘decentralised application’](https://github.com/lukehedger/dapps-the-way-i-like-it) but we’ll go with ‘dapp’.

### Current state of dapp development

Dapp development as a discipline is very young and best practices are still being worked out as the technology evolves.

A good way to approach building a dapp is to take all your knowledge about web apps and simply **add decentralised aspects incrementally**. Start with a basic smart contract and build a nice interface for it. Then, perhaps offload the storage of some static assets to a distributed CDN like Swarm or IPFS. As you explore the decentralised web you will find different ways of thinking about web development and new tools to help you apply these ideas.

One of the first tools web3 developers reach for is [web3.js](https://github.com/ethereum/web3.js/tree/1.0), a JavaScript library for working with Ethereum. Web3.js allows you to deploy smart contracts, create new Ethereum accounts, call a contract’s methods and retrieve data about the network such as the current block number or gas price.

> A note on **web3.js**: The web3.js library is maintained by the Ethereum Foundation and has become the popular library but there are others such as [ethers.js](https://github.com/L4ventures/ethers.js) and [ethjs](https://github.com/ethjs/ethjs), which are worth exploring as you experiment with this stack.

### Smart contracts, meet websites

When it comes to [interacting with a smart contract](http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html) from a dapp, optimum architectural patterns are still emerging. The real challenge here is how 3rd party smart contract authors can **efficiently distribute contract** [**ABI**](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI)**s** along with deployed contract addresses.

Many Ethereum-based projects have tended to release a JavaScript library that allows client developers to interact with contracts (see: [0x](https://github.com/0xProject/0x-monorepo), [Aragon](https://github.com/aragon/aragon.js), [Civil](https://github.com/joincivil/Civil), [Gnosis](https://github.com/gnosis/gnosis.js) and [Winding Tree](https://github.com/windingtree/wt-js-libs)); whilst projects such as [zeppelinOS](https://blog.zeppelin.solutions/technical-details-of-zeppelinos-d3cf4da591f7) and [aragonOS](https://blog.aragon.one/introducing-aragonos-3-0-alpha-the-new-operating-system-for-protocols-and-dapps-348f7ac92cff) are working on more novel solutions. There is also a proposed specification for an [Ethereum Package Manager](https://github.com/ethpm/ethpm-spec) that would standardise the distribution of smart contracts.

For now, one way to interact with your smart contracts from a JavaScript application is to treat the interface to each one like a **micro-library**.

![](/images/crossing-over-to-web3-decentralised-applications/1.png)

_Smart contract micro-library architecture_

By adding an API layer on top of a contract, we can **abstract the nuances of the underlying web3.js library** and Ethereum node interaction away from application code. For example, the web3.js API for calling a contract method can be simplified:

```
// web.js API
myContract.methods.myMethod([param1, param2])
```

```
// application API
myMethod(param1, param2)
```

Additionally, these services lend themselves to succinct unit testing, which can double as smart contract unit tests. As with writing distributable JavaScript packages, it is a useful convention to **test the built output** (ABI) rather than the source (Solidity).

As mentioned above, best practices are still being formulated and a lot of the current conventions may change over time. We just need to **find the simplest way of doing things** today whilst keeping **an eye on emerging alternatives**.

As [Stephan Tual](https://medium.com/u/1998e2015f47) puts it in his [Web3.0 Revisited post](https://blog.stephantual.com/web-3-0-revisited-part-one-across-chains-and-across-protocols-4282b01054c5):

> Just like it took 20 years to settle on an HTML/JavaScript/CSS presentation layer over HTTP to form ‘Web 2.0’, it might (and certainly will) take a significant amount of time to define the optimal Dapp distribution mechanism for ‘Web 3.0’.

### Setup

In the last issue, we built some smart contracts for a crypto-economically incentivised todo list — Todoeth! In this issue, we’re going to be **building the decentralised Todoeth application**, which will use these smart contracts.

If you haven’t done so already, clone the example project codebase and checkout this issue’s branch:

```
git clone https://github.com/lukehedger/todoeth.git
cd todoeth
git checkout issue#3-dapps
```

Run the following command to install the project’s dependencies and then we’ll dive in to dapp development:

```
npm install
```

> Let’s look at the anatomy of a decentralised application

### Environment

To keep things simple, the application does not use any frameworks for rendering views or managing state. However, the application logic is split into modules to aid comprehension so we need a module bundler to assemble these separate files into a single, distributable file. [Parcel](https://parceljs.org/) has been chosen as our module bundler, as it allows us to keep this process hidden behind NPM scripts — thanks to its zero-configuration feature.

This means, in addition to our contract compilation and deployment scripts, we now have commands for starting a development server and building the application for release.

Todoeth has two other dependencies that need to be installed: [**Geth**](https://github.com/ethereum/go-ethereum/) (the Go implementation of Ethereum) and [**Swarm**](http://swarm-gateways.net/bzz:/theswarm.eth/). Follow the [instructions in the README](https://github.com/lukehedger/todoeth/blob/issue%233-dapps/README.md) to set Geth and Swarm up and get the application running locally.

### Project structure

The structure of a dapp is largely similar to a traditional web app — HTML, CSS, JavaScript — just with the addition of smart contracts and some way to utilise these contracts, like web3.js.

The Todoeth dapp has a [module that initialises web3.js](https://github.com/lukehedger/todoeth/blob/issue%233-dapps/app/js/web3.js):

```
import Web3 from 'web3'
```

```
// init the web3 library using a local RPC endpoint
const web3 = new Web3(
  new Web3.providers.HttpProvider('http://localhost:8545')
)
```

```
// init Swarm using a local node
web3.bzz.setProvider('http://localhost:8500')
```

```
export default web3
```

And a single [contract interface to](https://github.com/lukehedger/todoeth/blob/issue%233-dapps/app/contracts/Todo.sol.js) [Todo.sol](https://github.com/lukehedger/todoeth/blob/issue%233-dapps/app/contracts/Todo.sol.js):

```
import web3 from "../web3"
```

```
const abi = [ ... ]
```

```
export const Todo = new web3.eth.Contract(
  abi,
  "0x5Df6Dda58260221D6e102e8A2E78E9f6A47E3d1d"
)
```

### User interface

Todoeth has two primary functions: **display existing todos** and **create new ones**.

![](/images/crossing-over-to-web3-decentralised-applications/2.gif)

_Todoeth dapp_

The application includes a [simple state machine](https://github.com/lukehedger/todoeth/blob/issue%233-dapps/app/js/state.js) to manage application state. When the dapp launches, we initialise the application state with some defaults, like the todo stake. We also get a list of Ethereum accounts that our local node controls and set the current user to one of these accounts.

In a _real-life_ application, we would perhaps set this to an account loaded to a web wallet like [MetaMask](https://metamask.io/) or [from a hardware wallet](https://github.com/LedgerHQ/ledgerjs). The test accounts on our local Ethereum node are all ‘unlocked’ by default — normally, we would need to ask the user to decrypt (or unlock) their account with a passphrase in order to sign transactions (like adding a new todo).

### Ethereum interface

Once we have established the current user’s Ethereum address, we can make a call to our contract to retrieve their todo lists. Remember, the actual todo data is stored on Swarm and the Swarm content hash is stored in the smart contract.

The process of retrieving dynamically sized arrays from a smart contract is slightly convoluted, due to a limitation of the EVM (although this is [being worked on](https://github.com/ethereum/solidity/issues/2948) and a fix is available behind the pragma experimental ABIEncoderV2 flag). First, we must get the current length of the array and then get each item in the array in a separate call:

```
import Todo from './contracts/Todo.sol.js'
```

```
// Send transaction to get the number of todos in the todo list
const todoCount = await Todo.methods.getTodoCount().call()
```

```
// Send transaction to get the todoId for each todo in the todo list
const todoIds = await Promise.all(
  Array(Number(todoCount))
    .fill()
    .map((x, todoIndex) => Todo.methods.getTodo(todoIndex).call())
)
```

Adding a new todo involves first uploading the todo data to Swarm (which is covered in the next section) and then sending a transaction to the Todo.sol contract:

```
// Send transaction to add a new todo
const tx = await Todo.methods.addTodo(todoId).send()
```

You’ll notice that some transactions are invoked with the call method and some with the send method; the main difference here is that call is a read-only operation that cannot change the contract state and send is a write operation that can change state. Also see this comprehensive [explanation of the difference](https://ethereum.stackexchange.com/questions/765/what-is-the-difference-between-a-transaction-and-a-call/770#770).

### Swarm interface

Once the dapp retrieves a set of Swarm content hashes (todoIds) from the smart contract, we can then resolve those hashes and download the corresponding data from Swarm:

```
// Download each todo's raw data from Swarm
const rawTodos = await Promise.all(
  // Remove leading `0x` from todoId to get the Swarm content hash
  todoIds.map(todo => web3.bzz.download(todo.slice(2)))
)
```

Each item of todo data is stored in Swarm as aUint8Array and can be converted back into a String like so:

```
// Convert raw todo data back to plain todo object
const todos = rawTodos.map(todo => {
  // For each property, convert value from Uint8Array to String
  return Object.keys(todo)
    .map(key => ({
      [key]: new TextDecoder("utf-8").decode(todo[key].data)
    }))
    .reduce((o, v) => Object.assign({}, o, v), {})
})
```

When the user adds a new todo, the todo data is uploaded to Swarm and the returned content hash is passed to the smart contract:

```
// Upload the todo data to Swarm and receive the content hash
const swarmHash = await web3.bzz.upload({
  complete: false,
  deposit: 1,
  owner: '0x123...abc',
  task: 'Learn about dapps',
  timestamp: '1521193668',
})
```

```
// Convert raw swarm hash to bytes
const todoId = `0x${swarmHash}`
```

### Roadmap

The main purpose of this tutorial and example project was to help web developers get started with web3 development by demonstrating how to use Ethereum and Swarm to maintain a list of items. There is definitely a lot of scope to build upon our simple todo list — so, please do fork the repo and make it your own!

First of all, you cannot actually complete a todo 🙁 — I’ll leave it up to you to think about how this could be built in and also how the todo deposit could be used to incentivise doers!

### Production

Dapps can be hosted in ‘production’ on Swarm and IPFS, with smart contracts deployed to testnets (or the mainnet), using a tool like the one provided by [MyCrypto](https://mycrypto.com/#contracts). This is beyond the scope of a simple example so we’ll have to explore this separately but there are [tools emerging](https://ethdeploy.com/) in this area.

When it comes to using dapps in a browser connected to an Ethereum testnet (or mainnet) with an account that holds test (or real) Ether — as opposed to a local development node with test accounts — the easiest way is currently to use the MetaMask web extension. The extension is available in Chrome, Firefox and Opera and support is built-in to the [Brave browser](https://brave.com/) (who are real advocates of the decentralised web). Another option is [Cipher](https://www.cipherbrowser.com/), which is a mobile browser and wallet.

#### Become a web3 developer

This series of posts hopefully helped you to understand the concepts of web3 development and how to write smart contracts and dapps. The next step is to start experimenting: come up with an idea for a small web3 project then find some collaborators — or go it alone — and build a dapp!

Remember, this space is as much about research as output at the moment so just enjoy exploring this exciting stack and playing with your ideas. If something seems complex it probably means it is not just you that is trying to figure it out!

-   You can ask questions on [Hashnode](https://hashnode.com/n/ethereum) or [Spectrum](https://spectrum.chat/ethereum)
-   Check out the [Ethereum subreddit](https://www.reddit.com/r/ethereum/)
-   Subscribe to newsletters: [Week in Ethereum](http://www.weekinethereum.com/) and [Token Economy](http://weekly.tokeneconomy.co/)
-   Listen to podcasts: [Epicenter](https://epicenter.tv/), [Software Engineering Daily](https://softwareengineeringdaily.com/) and [Unchained](http://unchainedpodcast.co/)

#### Some further reading/inspiration

-   👓 [Broader overview](https://thecontrol.co/a-brief-overview-of-dapp-development-b8ac1648322c) from [The Control](https://medium.com/u/71dd1dce0298)
-   🐈 Projects to explore: [Colony](https://colony.io/), [CryptoKitties](https://www.cryptokitties.co/), [Decentraland](https://decentraland.org/), [District0x](https://district0x.io/), [Giveth](https://giveth.io/), [Status](https://status.im/)
-   🧟‍ Interactive tutorials: [CryptoZombies](https://cryptozombies.io/), [Dharma](https://dharma.io/tutorial), [Ethernaut](https://ethernaut.zeppelin.solutions/)

#### Project Update

We [recently announced](https://medium.com/kordnetwork/from-meta-to-kord-9c3cf8f0d082) that the META network has morphed into [KORD](https://kord.network) — a global, unified framework for intellectual property rights. Over the next few months we’ll share more information about the platform and the tools and applications we are building.

To keep updated sign up to our newsletter at [KORD.network](https://kord.network) or [join the community](https://community.kord.network).

#### Find [JAAK](https://jaak.io/) on [Twitter](https://twitter.com/jaak_io) and [Facebook](https://www.facebook.com/JAAK.io/).
