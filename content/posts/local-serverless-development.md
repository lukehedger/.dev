---
title: Local Serverless Development
description: Using Serverless Stack for super-powered local development
publishDate: '2021-10-01'
tags:
  - serverless
source: Matcha Latte
---

![Photo by Oliver Hale on Unsplash](/images/local-serverless-development/local-serverless-development.jpg)

For software engineers building serverless applications, the development workflow is [often one of the primary drawbacks](https://serverlessfirst.com/serverless-adoption-initial-survey-results/). This is especially apparent when compared to the rapid feedback loops engineers have become used to in React and Node.js application development, where local dev-servers can be instantly refreshed with code changes.

It is the inherent nature of serverless applications that make such feedback loops seemingly impossible: cloud-first, event-driven and deployed via pipelines.

Attempts have been made to bring this flavour of local development to serverless applications. These workflows have often involved [mocking cloud resources](https://localstack.cloud/) or [restricting local development](https://github.com/dherault/serverless-offline) to [APIs and functions](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-start-api.html).

Whilst these are all amazing tools, the ultimate serverless application development environment should enable engineers to make local function and infrastructure code changes, instantly deploy to the cloud and see that code running on actual resources, as it would for the application's users.

Enter [Serverless Stack](https://serverless-stack.com/)!

### What is the Serverless Stack?

[AWS CDK](https://aws.amazon.com/cdk/) is quickly becoming the optimum way to define cloud infrastructure as code, using general-purpose programming languages like TypeScript, rather than configuration languages like YAML, JSON or HCL. With the CDK, infrastructure is defined through "constructs", which are essentially components that compile to CloudFormation definitions of AWS cloud resources, like DynamoDB tables and SQS queues.

Serverless Stack (SST) leverages the AWS CDK by providing convenient higher-level constructs for building common application components that bundle multiple CDK constructs together. Take for example, the [ReactStaticSite construct](https://docs.serverless-stack.com/constructs/ReactStaticSite), which will deploy resources including an S3 bucket and CloudFront CDN to serve your React website on AWS. SST also wraps convenience APIs around single constructs, abstracting some of the lower-level details of the underlying CDK constructs - like the [EventBus construct](https://docs.serverless-stack.com/constructs/EventBus).

The real magic of SST is its [Live Lambda Development environment](https://docs.serverless-stack.com/live-lambda-development).

> Live Lambda Development allows you to debug and test your Lambda functions locally, while being invoked remotely by resources in AWS. It works by proxying requests from your AWS account to your local machine.

By defining your [API Gateway APIs](https://docs.serverless-stack.com/constructs/Api) and [Lambda functions](https://docs.serverless-stack.com/constructs/Function) with SST's constructs, serverless engineers will be able to update and debug function code on a local machine, then see it running *live* on AWS!

![SST Live Lambda Development](/images/local-serverless-development/sst-live-lambda-development.png)

Let's take a look at some of the workflows that the SST Live Lambda Development environment enables.

### Local development

The biggest boost SST gives serverless engineers is the ability to write `console.log` in a local Lambda function file, invoke the function on AWS, allow it to interact with other services such as EventBridge and SNS, and finally see the log in a local terminal. Incredible!

We have removed any requirement for resource mocking or local emulation. And thanks to SST's innovative use of WebSockets, we do not need to deploy Lambda function code - this means those `console.log`s are in our functions super quick.

All features of the Lambda runtime are available, including environment variables (defined via IaC) and function IAM permissions - this means that if an invocation were to fail in a production envrionment due to insufficent permissions, it would fail locally as well.

### Debugging

Trying to debug a Lambda function or event flow can be extremely difficult without augmenting the application code or infrastructure with logs and additional monitoring. With SST, we can use [VS Code Debug breakpoints](https://code.visualstudio.com/Docs/editor/debugging#_breakpoints) to inspect function payloads and evaluate expressions.

### Testing

Automated testing is an integral part of any serverless application but running these tests locally has traditional been clunky and unpredictable. Now, we can start to imagine how SST could power serverless TDD. We could run [Jest in watch mode](https://jestjs.io/docs/cli#--watch) to continuously unit test functions and infastructure. We could test entire applications with local function code and cloud resources, via various entry-points: `curl`/Postman for APIs, dev-servers and [Playwright](https://playwright.dev/) for UIs, AWS CLI with generated JSON payloads for events, Jest for integration tests asserting against DynamoDB, SQS and so on.

SST also includes built-in support for ESLint and TypeScript, meaning we can run linting and static analysis on Lambda function code automatically on every code change before deploying.

### Infrastructure

SST will watche for changes to infrastructure as well as function code, and will prompt for deployment. Deployments are queued if the infrastructure is changed whilst a deployment is in progress.

### Step Functions

Engineers can deploy changes to Step Functions state machine definitions via SST/CDK, and get live updates for any Lambda functions defined within the Step Functions workflow. The SST environment can be combined with [AWS Toolkit](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/stepfunctions.html) to execute state machines from VS Code, as well as download and visualise definitions.

### Drawbacks

There must be some, right? I've only found one so far but will keep looking! Console logs are sent to stdout but not to CloudWatch. Not a major issue, just something to be aware of.

### Alternatives

The AWS SAM team have recently beta-released a similar tool - see [this GitHub issue for more details](https://github.com/aws/aws-sam-cli/issues/3264). And you'd think the AWS CDK team would not be far behind. Watch this space - local serverless development can only get better! 🎉

### Resources

- [Example repo lukehedger/local-serverless-development](https://github.com/lukehedger/local-serverless-development)
- [SST docs](https://docs.serverless-stack.com)
- [@serverless-stack/cli](https://docs.serverless-stack.com/packages/cli)
- [@serverless-stack/resources](https://docs.serverless-stack.com/packages/resources)
