---
title: Native Node.js Source Maps in AWS Lambda
description: >-
  Since Node.js v12, native source maps can help make sense of stack traces from
  Lambda functions
publishDate: '2021-09-06'
tags:
  - serverless
source: Matcha Latte
---

![Macaroons by Holly Stratton on Unsplash](/images/lambda-source-maps/lambda-source-maps.jpg)

### TL;DR

With Node.js v12+, [**native source maps**](https://nodejs.medium.com/source-maps-in-node-js-482872b56116) can be applied to stack traces. Support for source maps is currently [behind a flag](https://nodejs.org/dist/latest-v12.x/docs/api/cli.html#cli_enable_source_maps) and can be enabled in any Node.js v12+ Lambda function via the [`NODE_OPTIONS`](https://nodejs.org/api/cli.html#cli_node_options_options) environment variable:

```
NODE_OPTIONS=--enable-source-maps
```

The corresponding source map for your Lambda function must be uploaded alongside your handler code. If you are not already generating source maps, you'll need to enable this with your bundler of choice.

---

A common pattern when running [AWS Lambda](https://aws.amazon.com/lambda/) functions on [Node.js](https://nodejs.dev/) is to use a module bundler (like [Webpack](https://webpack.js.org/), [esbuild](https://esbuild.github.io/) or [Parcel](https://parceljs.org)) to include NPM packages in the deployed handler code. This process produces a single JavaScript file that includes your function code and any NPM packages resolved from `import`/`require` statements. Any logs sent to CloudWatch from such a Lambda function would include a stack trace with references to this single JavaScript file. Without source maps, the usefulness of a stack trace will be very limited.

Let's look at a real-life example that I encountered recently. I picked up a ticket to investigate a pretty obscure production bug, where a Lambda function was returning an error response via API Gateway, with the message `Cannot read property 'val' of null`. To begin with, this is not a particularly helpful error message! And the stack trace in CloudWatch Logs is not much more help:

```
TypeError: Cannot read property 'val' of null
  at Object.eval (eval at compileRestore (/var/task/src/handler/index.js:19131:20), <anonymous>:299:77)
  at Object.eval (eval at redactor (/var/task/src/handler/index.js:19016:18), <anonymous>:1195:10)
  at Pino.asJson (/var/task/src/handler/index.js:19991:45)
  at Pino.write (/var/task/src/handler/index.js:19646:28)
  at Pino.LOG (/var/task/src/handler/index.js:19914:21)
  at module.exports.__webpack_modules__.27750.exports.default (/var/task/src/handler/index.js:92651:24)
  at processTicksAndRejections (internal/process/task_queues.js:97:5)
```

This will look familiar if you've ever transpiled JavaScript code or used a module bundler before deploying code to AWS Lambda. In this case, we are using Webpack, via the [`serverless-webpack`](https://github.com/serverless-heaven/serverless-webpack) Serverless Framework plugin. Looking at this stack trace, I can just about tell that the error has something to do with the [`pino`](https://github.com/pinojs/pino) logger. Beyond that, it is going to be extremely difficult to pinpoint the root cause of the error.

### Source maps to the rescue!

Enabling native Node.js source maps on AWS Lambda requires two things: running Node.js with source maps enabled and generating (and deploying) source maps for your Lambda function code.

Support for source maps is currently [behind a flag](https://nodejs.org/dist/latest-v12.x/docs/api/cli.html#cli_enable_source_maps) and can be enabled in any Node.js v12+ Lambda function via the [`NODE_OPTIONS`](https://nodejs.org/api/cli.html#cli_node_options_options) environment variable:

```
NODE_OPTIONS=--enable-source-maps
```

If you are using the [Serverless Framework](https://www.serverless.com/), your function configuration will need to look something like this:

```
functions:
  hello-world:
    name: hello-world
    handler: src/handler/index
    environment:
      NODE_OPTIONS: --enable-source-maps
```

Source maps can be generated automatically by Webpack and are configured with the [`devtool` option](https://webpack.js.org/configuration/devtool/). There are lots of options but there are recommended choices for [local development](https://webpack.js.org/configuration/devtool/#development) and [production](https://webpack.js.org/configuration/devtool/#production).

After enabling source maps, you will notice corresponding `*.js.map` files in your build output directory - these will need to be deployed along with your handler code. You will also notice source map references in the JavaScript code that look like this:

```
//# sourceMappingURL=someFunction.js.map
```

With source maps deployed and enabled, the stack trace for the same error now looks like this:

```
TypeError: Cannot read property 'val' of null
  at Object.eval (eval at compileRestore (/var/task/src/handler/webpack:/my-service/node_modules/@some-org/logger/node_modules/fast-redact/lib/restorer.js:16:1), <anonymous>:299:77)
  at Object.eval (eval at redactor (/var/task/src/handler/webpack:/my-service/node_modules/@some-org/logger/node_modules/fast-redact/lib/redactor.js:9:1), <anonymous>:1195:10)
  at Pino.asJson (/var/task/src/handler/webpack:/my-service/node_modules/@some-org/logger/node_modules/pino/lib/tools.js:115:1)
  at Pino.write (/var/task/src/handler/webpack:/my-service/node_modules/@some-org/logger/node_modules/pino/lib/proto.js:148:1)
  at Pino.LOG (/var/task/src/handler/webpack:/my-service/node_modules/@some-org/logger/node_modules/pino/lib/tools.js:38:1)
  at module.exports.__webpack_modules__.27750.exports.default (/var/task/src/handler/webpack:/my-service/src/index.js:98:1)
  at processTicksAndRejections (internal/process/task_queues.js:97:5)
```

From this source map-enhanced stack trace, I can now see that the error originated in the `fast-redact` package, which is a dependency of `pino`. Now that I have the file and line reference for the origin of the error I can now begin to isolate, replicate and, hopefully, fix the bug. 🙏
