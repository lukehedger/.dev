---
title: OpenShift
description: >-
  You've just finished building a killer Node-based API but need a host who
  doesn't rip you off - who can you turn to?
publishDate: '2015-06-01'
tags:
  - node
  - hosting
source: level-out.com
---

### Free

With the [demise of Nodejitsu](https://blog.nodejitsu.com/nodejitsu-joins-godaddy/), it's not easy finding free Node.js hosting these days. But OpenShift has a [really good free plan](https://www.openshift.com/web-hosting/node-js) with capacity for 3 applications. You're tied to an `rhcloud.com` subdomain but if you're just hosting an API or service who cares?

### Bit of a git

It's free, happy days! But I did find the setup slightly painful. I wanted a setup similar to [Divshot](https://divshot.com/): `npm install crazy-shit`, `init bruv` and `deploy to-the-world`. No such luck but it's not too bad once you know how...

Sign-up for an account, create a new app using the `nodejs-0.10` cartridge and away you go. OpenShift basically hosts a Git repo on its server holding all your project's code - when you create a new Node.js app they initialise it with a sample Express.js app. Once you've completed the app creation process, OpenShift will prompt you to clone this repo. You can do this, edit the code and `git add/commit/push` and this will deploy changes to your site. Kinda cool. But, most likely, you've already got a repo (or will set one up) on GitHub/Bitbucket to store your code. I guess it'll be down to personal preference but I felt more comfortable storing my primary codebase on GitHub and then just pushing to OpenShift when I was ready to deploy. If you're with me on that one follow the below steps to merge the two repos otherwise don't pass Go.

First create a new remote on your existing repo to the OpenShift repo:

```bash
$ git remote add openshift -f <openshift-git-repo-url>
```

Then run:

```bash
$ git merge openshift/master -s recursive -X ours
```

All the files from your OpenShift repo will merge into your local repo - fix any conflicts and then:

```bash
$ git push openshift HEAD
```

Now, you'll be able to make changes to your code and `git push` to your GitHub repo as normal. Anytime you want to push to OpenShift (thus deploying your site) run `git push openshift`. Simple. It's just a deploy process using Git - once you're cool with that OpenShift feels like a breeze.

### Host/Port

When you point your server to a host/port you'll need to use OpenShift's environment variables with a local fallback. Here's a quick sample Express server:

```js
var express = require('express'),
    app = express();

var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000;

app.get('/', function (req, res) {
    res.send('Hello World!');
});

var server = app.listen(server_port, server_ip_address, function () {
    var host = server.address().address,
        port = server.address().port;

    console.log( "Listening on http://" + host + ":" + port );
});
```

### CLI

OpenShift has a tool called `rhc` that's useful for managing your apps on the command-line. Install it and setup with:

```bash
$ gem install rhc
$ rhc setup
```

You can then get a list of your apps:

```bash
$ rhc apps
```

### Env vars

Another useful command is setting environment variables:

```bash
$ rhc env set VARIABLE1=VALUE1 -a appname
$ rhc env list -a appname
```

### Server logs

OpenShift provides a shortcut for SSHing onto your server - find it on your application's dashboard under "Remote Access". Once you're on, you can find the server logs under: `app-root/logs/`
