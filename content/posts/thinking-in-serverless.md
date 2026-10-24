---
title: Thinking in Serverless
description: Time to start thinking about applications with a serverless mindset
publishDate: '2020-11-27'
tags:
  - serverless
source: Matcha Latte
---

![Serverless](/images/thinking-in-serverless/thinking-in-serverless.jpg)

Serverless allows you to build and run applications and services without thinking about servers - in this way, they are “server-less”.

Serverless applications are generally built using _fully managed services_. AWS provides managed services for compute (Lambda, Step Functions), storage (DynamoDB, S3) and application integration (EventBridge, SNS, SQS). By utilising such services we can remove the overhead associated with resource provisioning, configuration and scaling and drastically reduce the cost of running our applications.

Instead of thinking about servers and infrastructure management, serverless application developers can focus on delivering features for their users and generating value for their business.

The key benefits of adopting a serverless approach are:

- No server or infrastructure management
- Flexible application scaling
- Consumption-based billing
- Built-in high availability and fault tolerance

A lot of related concepts compliment serverless and many modern software engineering practices are also made possible by serverless. These include: event-driven architectures, infrastructure as code, CI/CD, DevOps, test automation and zero-trust security. Indeed, cloud computing in general is fast becoming synonymous with serverless.

The term ["full stack serverless" has been coined](https://dev.to/dabit3/the-full-stack-serverless-manifesto-3jjh) to describe the paradigm that is enabled by serverless: a world with a very low entry barrier; where software engineers can operate right across the stack, without the traditional constraints of skillsets or gatekeeping.

The possibilities open to serverless application developers are incredibly empowering. We can write truly universal TypeScript that runs across the entire stack: from frontend web applications and backend compute, to automated tests, cloud infrastructure and deployment pipelines. We can take ownership of the entire software development lifecycle: from development, integration and deployment to operations and observability.

For more information see:

- [Serverless is a State of Mind](https://ben11kehoe.medium.com/serverless-is-a-state-of-mind-717ef2088b42) by Ben Kehoe (iRobot)
- [Serverless Engineer, where are you?](https://medium.com/lego-engineering/serverless-engineer-where-are-you-323ae727f4d2) by Sheen Brisals (Lego)
- [Serverless Architectures](https://martinfowler.com/articles/serverless.html) on the Martin Fowler blog

If you want to go further into the theory behind serverless, AWS publishes a [training course](https://www.aws.training/Details/eLearning?id=27198) all about getting into the "serverless mindset".

### Getting Started

A great place to start building serverless applications is the [AWS Cloud Development Kit (CDK) workshop](https://cdkworkshop.com/). This will show you how to build, test and deploy a simple serverless application, using the CDK. You will write "Infrastructure as Code", use core AWS services like API Gateway and Lambda and will begin to get an idea of the serverless development workflow.

Enjoy! 😌
