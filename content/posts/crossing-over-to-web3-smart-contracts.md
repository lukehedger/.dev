---
title: Crossing Over to Web3 – 02 Smart Contracts
description: "Issue #2 of the definitive developer’s guide for the journey from web2 to\_web3"
publishDate: '2017-11-27'
tags:
  - web3
  - dapps
  - blockchain
  - ethereum
  - development
source: JAAK
originalUrl: 'https://medium.com/jaak-io/crossing-over-to-web3-smart-contracts-3a295e35e5c0'
---

#### 🙌

_Welcome back to the series of blog posts that aims to get web developers building decentralised applications and smart contracts on Ethereum in the_ **_simplest way possible_**_._

_If you missed the first issue —_ [_travel back in time and read it_](https://blog.jaak.io/crossing-over-to-web3-an-introduction-to-decentralised-development-53de470da331)_. This second issue will be all about writing Ethereum Smart Contracts, accompanied by an example project._

### What is a Smart Contract?

As covered in the first issue of this series:

> Smart contracts in the context of Ethereum are scripts that are executed on a global network of public nodes — the EVM (Ethereum Virtual Machine) — and can read/write transactions from/to the blockchain.

A **_contract_** is “a voluntary arrangement between two or more parties” ([Wikipedia](https://en.wikipedia.org/wiki/Contract)).

A **_smart contract_**, then, is “a computer protocol intended to facilitate, verify, or enforce the negotiation or performance of a contract” ([Wikipedia](https://en.wikipedia.org/wiki/Smart_contract)).

Cryptographer [Nick Szabo first proposed the idea of smart contracts](http://www.fon.hum.uva.nl/rob/Courses/InformationInSpeech/CDROM/Literature/LOTwinterschool2006/szabo.best.vwh.net/idea.html) way back in the 90s and they have since featured heavily in many cryptocurrency-based projects, most notably Ethereum.

> The primitive ancestor of smart contracts, is the humble vending machine. Within a limited amount of potential loss (the amount in the till should be less than the cost of breaching the mechanism), the machine takes in coins, and via a simple mechanism, dispense change and product according to the displayed price.

So, to advance our definition beyond the context of Ethereum: **a smart contract can be used to programmatically and _autonomously_ enforce agreements**. The implication of this is, of course, the removal of centralised intermediaries. Hence the usefulness in decentralised software.

### Setup

Without further ado, go ahead and grab the example project codebase:

```
git clone https://github.com/lukehedger/todoeth.git
cd todoeth
git checkout issue#2-smart-contracts
```

We’re going to look at **a crypto-economically incentivised todo list** — let’s call it **Todoeth** 🤑. In the next two issues, we’ll start to build a todo list app that will pressure the user to complete their todos with the prospect of losing their money!

![](/images/crossing-over-to-web3-smart-contracts/1.png)

_Wireframe for Todoeth. Icon by [Hea Poh Lin](https://thenounproject.com/charlenehea/)._

Run the following command to install the project’s dependencies and then we’ll dive in to smart contract development:

```
npm install
```

> Let’s look at the stages of smart contract development

### Design

Every robust program starts off with a clear and complete architectural design and this is especially crucial when writing Smart Contracts. Given the immutable nature of contracts deployed to the Ethereum blockchain, it is imperative that all eventualities are considered.

In client-server web applications, when a bug is found we can simply (!) deploy a patch to the production server and all future visitors to our site will receive the fixed version. The tradeoff for permanent, verifiable, tamper-proof data records on Ethereum is contracts cannot simply be upgraded in this manner — otherwise, all of those records would be lost!

The key to designing an upgradeable contract system is to **separate storage contracts from proxy contracts** (we’ll look at this in more detail later on).

Our decentralised todo application will need three contracts:

-   A primary storage contract to store each user and their todos
-   A secondary storage contract to track deposits made against todos
-   A proxy contract to facilitate interactions from a web application

### Write

> A note on **Solidity**: whilst there are a few languages for writing Ethereum Smart Contracts, we will write ours with Solidity as it is currently the most widely used. We’ll use version 0.4.18, which is the latest stable version at the time of writing. There are syntax highlighters for [Atom](https://atom.io/packages/language-ethereum) and [Sublime](https://packagecontrol.io/packages/Ethereum).

Let’s start with the ubiquitous ‘Hello, World’ example but, instead of greeting the whole world, we’ll just say hello to the person who called the function:

```
pragma solidity ^0.4.18;
```

```
// import './SomeContract.sol';
```

```
contract HelloYou {
  event Hello(address you);
  
  function sayHello() public {
    address _person = msg.sender;
    
    Hello(_person);
  }
}
```

The **pragma** at the top of the contract is simply a [directive](https://en.wikipedia.org/wiki/Directive_\(programming\)) that tells the Solidity compiler which version to use.

This contract doesn’t have any imports but if it did we would define these beneath the pragma using relative file paths.

Next comes a **contract declaration**. To declare a contract, you use the contract keyword with the name of the contract — in this example, ‘HelloYou’.

This contract consists of an **event** and a **function**. Events are simply declared with the event keyword and a function signature: event name and parenthesised, typed arguments. In the above example, the event is called ‘Hello’ and accepts one argument ‘you’ with the type ‘address’ (address is just a special type in Solidity describing an Ethereum public address).

> A note on **types**: Unlike JavaScript (which is dynamically typed), Solidity is a statically typed language so the type of every variable must be specified. If you’ve been using Typescript or Flow to write your JavaScript (or have used other statically typed languages) then you’ll feel at home. Otherwise, you’ll soon get used to it.

The sayHello function uses one of Solidity’s [global namespace variables](https://solidity.readthedocs.io/en/develop/units-and-global-variables.html) msg.sender. This and other useful values are available to all contract methods. The msg.sender variable (perhaps, predictably) contains the Ethereum address of the message sender. So, we store this value in the \_person variable (no need for a var keyword, just a type, name and =) and pass it to the Hello event, which will trigger the event on the EVM.

That’s it! We just said hello to someone via a smart contract. This function can be called and the event listened for in a web application but we’ll save that for the next issue! As the ancient Ethereum proverb says: _“does an event on the EVM make a sound if nobody is listening to it?”_.

#### Patterns

As mentioned earlier, we must build our contracts in a way that enables **code upgrades without loss of data**. This is achieved by separating code that contains permanent state (anytime data is stored in a contract) from proxies that funnel data into these contracts for external sources, such as web applications. The storage contracts can remain extremely light and serve a single purpose that is unlikely to require an upgrade. We’ll look at storage contracts in detail in a few paragraphs time.

![](/images/crossing-over-to-web3-smart-contracts/2.png)

_Data flow for adding a new todo_

**Todo.sol**

The Todo contract is our ‘proxy’ to the storage contracts and the only contract that will be exposed to our web app. It will not store any data. This way, **all operations are routed through this contract** and any upgrades can be made without loss of data.

It has three methods:

-   addTodo(todoId) Passes the todo ID to the TodoStorage contract along with the msg.sender as a user ID and passes the msg.value (some tokens) to the TodoBank contract as a deposit amount
-   getTodo(index) Gets a todo from the TodoStorage contract by the index in the user’s array of todos
-   getTodoCount() Gets the number of todos a user has stored

The reason retrieving a todo from the store is split into two methods is due to a current limitation with Solidity that restricts the return of dynamically sized values, like arrays. So, we first have to get the length of the todos array and then get each todo individually by index 🙈. Fear not, this restriction will be removed in the next minor release 0.5.0.

#### Storage

Smart contracts can be used to store immutable, verifiable data on the Ethereum blockchain. This is a super powerful tool and can be used to enable a range of interesting forms of digital transactions and agreements.

In our todo example, we will store a reference to each task for eternity! We are also going to store some Ether (Ethereum’s native token) against each todo.

> A note on **metadata storage**: Storing data on Ethereum is deliberately expensive due to the permanency and computational power involved. There are a number of innovative solutions to this limitation emerging. One common pattern, which we will employ here, is to store metadata in a distributed storage system (like [Swarm](http://swarm-gateways.net/bzz:/theswarm.eth/) or [IPFS](https://ipfs.io/)) and store references to that metadata on Ethereum. We’ll cover how to do this in the next issue.

**TodoStorage.sol**

The TodoStorage contract simply contains methods for getting and setting todos. Metadata about the todo will be stored on Swarm and, so, the only data we actually store in the contract will be the Swarm reference to this metadata (an address of where to find the data in the Swarm network).

These references, which we will use as a todoId, are stored in an array and keyed by userId (the Ethereum address of the todo owner) in the TodoStore object.

This gives us a data structure like this:

```
TodoStore: {
  userId: [
    todoId
  ]
}
```

**TodoBank.sol**

The other contract used for storage is TodoBank. This is where we’ll store the Ether deposits made against each todo — the funds will be secured here until they are legitimately withdrawn. Again, this contract just contains methods for getting and setting deposits.

The data structure looks like this:

```
TodoVault: {
  todoId: deposit
}
```

It is beyond the scope of this example but you can see how incentive mechanisms could be built into this system. For example, if a todo is completed by a certain time the deposit is returned to the owner’s address but if the deadline is missed the funds are sent to another address that may have bet the owner would not complete it!

So, you must either complete a todo or face losing your deposit 💸. We will save this for a future issue!

#### Security

Software security is paramount when personal data and funds are involved. Given the inherent economic nature of smart contracts, and the immaturity of the languages used to write them, their security is particularly crucial — safety mechanisms must be built into the design and code of a contract.

Whilst experimenting with Solidity, it is enough to keep this concern in mind and be aware of some of the possible attacks contracts are open to. The [Ethereum Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/) guide is an excellent resource when you are ready to delve into security.

#### Linting

You can lint your contracts with [solium](https://github.com/duaraghav8/Solium), a tidy tool that follows similar conventions to ESLint.

To lint the contracts in the example project, run the following command:

```
npm run lint
```

#### Documentation

Solidity contracts can be documented with comments in the [Ethereum Natural Specification Format](https://github.com/ethereum/wiki/wiki/Ethereum-Natural-Specification-Format) (or, NatSpec), which is similar to JSDoc.

```
/*
 * @notice TodoAdded event
 * @param {bytes32} todoId
 */
event TodoAdded(bytes32 todoId);
```

### Compile

Contracts need to be **compiled with the Solidity compiler into bytecode** that can be read by the EVM.

It is possible to use the Solidity compiler directly via a JavaScript tool called [solc-js](https://github.com/ethereum/solc-js), which is maintained by the Ethereum Foundation developers.

The compiler takes an object of contract names and the stringified content of that contract and [returns the compiled bytecode](https://solidity.readthedocs.io/en/develop/using-the-compiler.html#output-description) and [an interface for interacting with the contract code, called the ABI](https://solidity.readthedocs.io/en/develop/abi-spec.html) (or, Application Binary Interface).

I’ve found that this workflow can be simplified by abstracting the repetitive tasks (parsing the contract input and writing the output to disk) into a library and controlling the input/output with a configuration file. This tool is called [**Sulk**](https://github.com/lukehedger/sulk) 😂!

Sulk takes a simple configuration file that, in its simplest form, looks like this:

```
module.exports = {
  contracts: [
    'Todo',
  ],
  inputPath: './path/to/contracts',
}
```

And writes a [contracts.json](https://github.com/lukehedger/todoeth/blob/issue%232-smart-contracts/contracts/contracts.json) file to your project, which includes the bytecode and ABI and can be used when ‘deploying’ your contracts.

To compile the contracts in the example project, run the following command:

```
npm run compile
```

### Deploy

To expose your contract and its methods, you need to **deploy it to the Ethereum blockchain**. This is akin to deploying a micro-service to a server and, as with server infrastructure, Ethereum has the concept of production, development and local networks. The production network — of which there is, obviously, only one — is commonly referred to as the ‘mainnet’ and development networks — of which there are a few, each with varying properties and capabilities — are called ‘testnets’.

The simplest way to start interacting with your contract is to deploy it to a local Ethereum network. [**ganache-cli**](https://github.com/trufflesuite/ganache-cli) (previously known as testrpc) is a Node.js based “personal blockchain for Ethereum development” that simplifies this process.

From the example project you can run the following command, which simply runs a locally installed ganache-cli binary without any arguments (and **makes you feel like a deity**):

```
npm run blockchain
```

Once ganache is running, you can use the deployment script included in the example project to deploy the contract to the local Ethereum node:

```
npm run deploy
```

The [deployment script](https://github.com/lukehedger/todoeth/blob/issue%232-smart-contracts/scripts/deploy-contracts.js) uses the [**Web3.js**](https://github.com/ethereum/web3.js) library to interact with the Ethereum node. Read through the code and comments to see the steps required to deploy a contract. Watch this space for tooling to simplify this process 👀.

> A note on **Web3.js**: The Web3.js library is maintained by the Ethereum Foundation and has become the popular library but there are others such as [ethers.js](https://github.com/L4ventures/ethers.js) and [ethjs](https://github.com/ethjs/ethjs), which are worth exploring as you experiment with this stack.

The deployment script will also store the **deployed contract addresses** in a JSON file for later use ([addresses.json](https://github.com/lukehedger/todoeth/blob/issue%232-smart-contracts/contracts/addresses.json)). Each deployed contract has an Ethereum address (just like an API has an HTTP endpoint) and these are needed when instantiating contracts to interact with them via tests and applications.

#### Gas

You may have heard the term ‘gas’ or notice references to it in the deployment script and example code. **Gas is simply a transaction fee charged for Ethereum operations**; the fuel for the EVM. Ultimately, gas is needed to prevent excessive use of the virtual machine.

> Gas: a measurement roughly equivalent to computational steps. Every transaction is required to include a gas limit and a fee that it is willing to pay per gas. If the total number of gas used by the computation spawned by the transaction is less than or equal to the gas limit, then the transaction processes. If the total gas exceeds the gas limit, then all changes are reverted.

[https://github.com/ethereum/wiki/blob/master/Glossary.md](https://github.com/ethereum/wiki/blob/master/Glossary.md)

### Test

It is possible to write Smart Contract unit tests in JavaScript. However, this comes with an overhead that may seem counterintuitive to developers used to writing unit tests for traditional client-server applications: It is necessary to run a local Ethereum node to execute contract methods on from JavaScript tests.

Tooling around simulating or stubbing network responses (like [Sinon.JS](http://sinonjs.org/) for Ethereum) would be great and will surely be developed as demand increases — Go and Python already have such tools. For now, though, we have to break a cardinal rule of unit testing and trigger network activity.

The example project tests can be run with:

```
npm test
```

**We will explore how to interact with Smart Contracts from web applications in detail in the next issue** but for now you can read through the tests to get an idea of how contract methods can be executed using Web3.js.

### Debug

The process of updating a contract’s code, compiling, deploying and running the unit tests is far too cumbersome to facilitate effective debugging. So, for debugging you can use **Remix**, a web IDE for writing, compiling, deploying and executing methods.

There is also a CLI tool called remixd that can be used to share your local contracts with the Remix IDE. The example project includes a command to enable this — then click the 🔗 button in the Remix toolbar to connect:

```
npm run remix
```

You can also [load the contracts into Remix from this Gist](https://gist.github.com/lukehedger/8e0169c74080f44c3752568a03d51f15).

#### Next time…

We’ll cover how to build a decentralised web application that interacts with the todo smart contracts.

#### Some further reading

-   📖 [Official Solidity docs](http://solidity.readthedocs.io/en/develop/introduction-to-smart-contracts.html)
-   🏊 [Deeper dive into Solidity](https://github.com/androlo/solidity-workshop)
-   🏪 [Solidity CRUD](https://medium.com/@robhitchens/solidity-crud-part-1-824ffa69509a)
-   ☝️ [Writing upgradeable contracts](https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88)

#### Project Update

An awesome by-product of projects run by people passionate about decentralised applications is the vast majority of the code is open source. This makes for a great opportunity to dig around in repos for inspiration and best practice — not to mention contributions!

Here at JAAK we are building the [META Network and protocol](https://github.com/meta-network/docs) and are currently [piloting both in a private alpha](https://cointelegraph.com/news/jaak-announces-meta-decentralized-network-backed-by-ethereum-and-swarm), populating the network with data from our industry partners. Take a [look at our code](https://github.com/meta-network) and jump into our [Slack channel](https://community.meta-network.io/) to chat about anything you find!

#### Find [us](https://jaak.io) on [Twitter](https://twitter.com/jaak_io) and [Facebook](https://www.facebook.com/JAAK.io/).
