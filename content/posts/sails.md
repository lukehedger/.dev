---
title: Sails.js
description: >-
  One of the strengths of Sails is its ability to interface with a range of
  databases using a uniform API.
publishDate: '2014-08-28'
tags:
  - sails
  - node
source: level-out.com
---

### Hitting the open sea with Sails.js

In this post I'm going to take a look at integrating with MongoDB - the leading NoSQL database. Hopefully by the end of the post you'll be set up with a Sails server, Mongo database and the basic structure of an app that you can build upon. Let's get started.

### Setup Sails

We'll begin by installing Sails and creating a new app:
```bash
$ sudo npm install -g sails
$ sails new testProject
```

You'll get the skeleton [structure](https://github.com/balderdashy/sails-docs/tree/master/anatomy/myApp) of a Sails app, including all the Grunt tasks needed to compile and build your app. I looked into swapping over to Gulp but Grunt is so baked-in to Sails it seemed like a waste of time. All the Grunt tasks are abstracted into their own files within the `/tasks` folder and its easy enough to add your own.

Next, install the [Sails MongoDB adapter](https://github.com/balderdashy/sails-mongo):

```bash
$ npm install sails-mongo
```

> In Sails, adapters act as the middleman (or middlelady) between the app and the database.

Adapters are essentially plugins for [Waterline](https://github.com/balderdashy/waterline) - this is how Sails can access data from a range of databases using a standard syntax. All of your CRUD functions will be routed through Waterline and *adapted* to a syntax the database understands.

Once you've installed the Mongo adapter, you'll need to configure your app to use it. Dive into the `/config` folder and edit the following files:

#### /config/connections.js

```js
module.exports.connections = {

  mongodb: {
    adapter: 'sails-mongo',
    host: 'localhost',
    port: 27017,
    user: '',
    password: '',
    database: 'testdb'
  }

};
```

#### /config/models.js

```js
module.exports.models = {

  connection: 'mongodb',
  migrate: 'alter'

};
```

#### /config/local.js

```js
module.exports = {

   port: process.env.PORT || 1337,
   environment: process.env.NODE_ENV || 'development',

   connections: {
      mongodb: {
        user: '',
        password: '',
        database: 'testdb'
      }
  }

};
```

### Setup MongoDB

If you've already got Mongo installed you can skip this part. Otherwise, we'll install MongoDB using [Homebrew](http://brew.sh/). Note - it may take some time for the install to complete so go get a cup of tea and leave it to run. Further info about installation can be found in the [Mongo manual](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#install-mongodb). Don't forget to create a directory for Mongo to store data in once the installation has completed!

```bash
$ brew update
$ brew install mongodb
$ mkdir -p /data/db
```

MongoDB must be started by running `mongod` before you start your Sails app. Then, if you run `sails lift` you can view your app at [http://localhost:1337/](http://localhost:1337/).

Once your MongoDB server is running, you can manage it using the `mongo` shell:

```bash
$ mongo
> db # current db
> shows dbs # list available dbs
> use testdb # switch to specified db, in this case testdb
> db.dropDatabase() # remove current db
> show collections # list collections within db
> db.user.find() # query specified collection, in this case user
```

See [Getting started with MongoDB](http://docs.mongodb.org/manual/tutorial/getting-started/) for more.

For bonus points you can also add a bit of security to your database by creating a new [admin user](http://docs.mongodb.org/manual/tutorial/add-user-administrator/):

```bash
> use testdb
> db.createUser(
  {
    user: "admin",
    pwd: "admin",
    roles:
    [
      {
        role: "userAdmin",
        db: "testdb"
      }
    ]
  }
)
```

These login credentials can then be added to your `config/local.js` file.

### Test it out

First create a new model and controller by running:

```bash
$ sails generate api User
```

Then add some attributes to your new User model (`api/models/User.js`):

```js
module.exports = {

  attributes: {

    username: {
      type: 'string',
      required: true,
      unique: true
    },

    password: {
      type: 'string',
      required: true
    }
  }
};
```

You can add a record using the model's JSON API by going to [http://localhost:1337/user/create?username=neo&password=test](http://localhost:1337/user/create?username=neo&password=test). Then view the model at [http://localhost:1337/user](http://localhost:1337/user) and your new user should be there!

> The automatic routing of the JSON API is handled by [Sails Blueprints](http://sailsjs.org/#/documentation/reference/blueprint-api?q=blueprint-routes) and can be configured in `config/blueprints.js`

I've only been working with Sails.js for a few days and have found it pretty straight-forward to get started with. This post should get you on your feet quickly but there's loads more to explore. I've included some resources below. Happy sailing and try not to get seasick!

### Resources

- [Sails.js docs](http://sailsjs.org/#/documentation)
- [sailsCasts](http://irlnathan.github.io/sailscasts) - these are awesome for getting a basic app up and running
- [Automatic reloading](https://coderwall.com/p/njcr7w) with forever
- [Intro to MongoDB](http://www.mongodb.com/presentations/building-web-applications-mongodb-introduction)
- [Genghis app](http://genghisapp.com/) - GUI for MongoDB admin as an alternative to `mongo` CLI
