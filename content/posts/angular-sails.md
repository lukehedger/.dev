---
title: Angular-Sails
description: Put the wind back in your Sails app with an Angular frontend
publishDate: '2014-12-02'
tags:
  - sails
  - angular
  - node
source: level-out.com
---

### Plain sailing with Angular

Sure, with Sails you can get a pretty mean API up and running in no time at all and also serve up client-side views in [numerous templating languages](http://sailsjs.org/#/documentation/concepts/Views/ViewEngines.html) but [as Michael Bleigh put it](https://divshot.com/blog/opinion/every-web-app-is-two-apps/) there are two sides to every web app.

And to make it nice and simple, Sails is front-end agnostic by design!

> Sails is designed to be compatible with any front-end strategy; whether it's Angular, Backbone, iOS/ObjC, Android/Java, Windows Phone, or something else entirely.

Angular seems to fit particularly nicely when it comes to web apps and there is also an official [angularSails](http://balderdashy.github.io/angularSails/#/api/ngsails.$sailsSocket) binding to wrap [Sails' socket.io client](http://sailsjs.org/#/documentation/reference/websockets/sails.io.js) - so let's go with that and see what happens! We'll aim to have a simple app that'll display a list of users.

### Sails

If you haven't already got a basic Sails app up and running, its easy - run the following commands and you'll be good to go:
```bash
$ npm install -g sails
$ sails new angular-sails
$ cd angular-sails
$ sails generate api User
$ sails lift
```

Check that your User API (controller/model) exists by going to the endpoint [http://localhost:1337/user](http://localhost:1337/user). You can add a new user at [http://localhost:1337/user/create?username=super&password=heroic](http://localhost:1337/user/create?username=super&password=heroic)

### + Angular

We'll start by clearing out some of the default Sails stuff and Angular-ising it. Your `views/layout.ejs` file will need to have the a couple of directives to bootstrap the app and a main controller, so go ahead and modify it with the following:
```html
<html ng-app="app">
...
  <body>
    <div ng-controller="AppController">
      <%- body %>
    </div>
  </body>
</html>
```

Then, the `views/homepage.ejs` file will simply contain:
```html
<div ng-view></div>
```

The homepage view will be injected where the [raw HTML local](http://sailsjs.org/#/documentation/concepts/Views/Locals.html) `body` is placed in the DOM. As this will be a *single-page app*, the homepage will be the only view used. Make sure your `config/routes.js` file looks like this:
```js
module.exports.routes = {
  '/': {
    view: 'homepage'
  }
}
```

We'll use [Bower](http://bower.io/) to install and manage our Angular dependencies - run `bower init` in the app root directory to create a `bower.json` file and then create a `.bowerrc` file with the following contents:
```js
{
  "directory": "assets/bower_components"
}
```

This ensures any Bower dependencies are installed in the `/assets` directory, which is where Sails serves up our static front-end from. Go ahead and install your dependencies:
```bash
$ bower install --save-dev angular angular-loader angular-mocks angular-route angularSails
```

### + a sprinkle of Structure

The best way to start developing a new app is to get a good structure in place - this allows you to visualise the app and be clear on how its different modules will work together. If you're working with a framework for the first time it's a good idea to do a bit of reading first or even use a generator. Sails comes with a pretty rigid/opinionated [base structure](http://sailsjs.org/#/documentation/anatomy/myApp) whereas Angular leaves it up to you. There are [various approaches](http://scotch.io/tutorials/javascript/angularjs-best-practices-directory-structure) and much depends on the projected size of your app. As we're only setting up a test app, we'll go with [Brian Ford's approach](http://briantford.com/blog/huuuuuge-angular-apps) slightly modified to fit with Sails:

```no-highlight
assets
├── fonts
├── images
├── js
|   ├── controllers
|   |   └── AppController.js
|   |   └── controllers.js
|   |   └── UserController.js
|   ├── dependencies
|   |   └── sails.io.js
|   ├── services
|   |   └── services.js
|   |   └── user.js
|   └── app.js
|   └── directives.js
|   └── filters.js
├── partials
|   └── partial.html
|   └── ...
├── styles
|   └── main.css
|   └── ...
├── templates
|   └── users.html
|   └── ...
├── favicon.ico
├── robots.txt
```

Let's take a closer look at some of those folders and files. First, we'll get our `app.js` setup - this is where the app and its dependencies are declared and where our [providers](https://docs.angularjs.org/guide/providers) can be configured.

```js
'use strict';

// declare app level module and [dependencies]
angular.module('app', [
  'ngRoute',
  'sails.io',
  'app.controllers',
  'app.services'
]).

// config providers
config(['$routeProvider', function($routeProvider) {

  $routeProvider.when('/app/user',{
    controller: 'UserController',
    templateUrl: '/templates/user/index.html'
  });
}]);
```

So, here we have our app module - which must match the ngApp directive in `layout.ejs` - and its dependencies, including Sails' socket.io client, our controllers, directives, filters and services.

If you open your app up now, you'll see an error in the console - something like `Uncaught ReferenceError: angular is not defined`. This is because `app.js` is loaded but the Bower components are not. Sails has a set of Grunt tasks that are run when you start the server and compile your app into `.tmp/public/`. These can be found and configured in `tasks/`, along with the `pipeline.js` file, which is where the load order of our assets is defined. Open the file up and amend the JavaScript files section to look like this:

```js
var jsFilesToInject = [

  // Load sails.io before everything else
  'js/dependencies/sails.io.js',

  // Load Angular and other Bower components
  'bower_components/angular/angular.js',
  'bower_components/angular-route/angular-route.js',
  'bower_components/angularSails/dist/ngsails.io.js',

  // Load Angular module files
  'js/app.js',
  'js/controllers/controllers.js',
  'js/services/services.js',

  ...
]
```

### = MmmmmVC

Now our dependencies are loaded correctly but you'll still receive some Angular-related console errors as some of them don't exist yet! Let's create a `controllers/controllers.js` file:

```js
'use strict';

var appControllers = angular.module('app.controllers', []);
```

And `services/services.js`:

```js
'use strict';

var appServices = angular.module('app.services', []);
```

These files allow us to define our individual controllers/services on global modules. This means we only have to declare single modules for controllers/services when initiating the app.

So now we'll create a couple of controllers - an `AppController` to handle app-wide logic and a more specific `UserController` to enable data transfer between the user view and API (or model).

```js
'use strict';

// AppController

appControllers.controller('AppController', function ($scope, UserFactory) {

  $scope.socket = io.connect();

  $scope.socket.on("connect", function() {
    console.log("socket connected");
  });

});
```

Here, the `AppController` is simply attaching the socket to the local `$scope` object and listening for the `connect` event. In a proper app this controller might also handle sessions and nav/route management - anything that will occur on the wider app view rather than specific views.

```js
'use strict';

// UserController

appControllers.controller('UserController', function ($scope, UserFactory) {

  $scope.users = UserFactory.users;

  $scope.getUsers = function() {
    UserFactory.getUsers().
      then(function() {
        $scope.users = UserFactory.users;
        });
    };

    // On View Loaded
    $scope.$on('$viewContentLoaded', function() {
      $scope.getUsers();
    });
});
```

The `UserController` listens for the `$viewContentLoaded` event on the users view and then fires the `getUsers()` method, which has been attached to the `$scope`. You'll also notice the `UserFactory` dependency has been injected into the controller - this is the service used to request data from the API via web sockets.

```js
'use strict';

// UserFactory

appServices.factory('UserFactory', function UserFactory ($sailsSocket) {

  UserFactory.users = [];

  // index - /user
  UserFactory.getUsers = function () {
    return $sailsSocket.get('/user').
      success(function(data, status, headers, config) {
        UserFactory.users = data.users;
      }).
      error(function(data, status, headers, config) {
        console.log("error:", data);
      });
    };

  return UserFactory;

});
```

The service uses the Angular-Sails binding by injecting `$sailsSocket` as a dependency. We can then call the `get` method to hit our API's endpoints. This method will return a promise that'll either resolve to `success` or `error`. These callbacks are in turn handled by `then` or `fail` on the controller. If the promise resolves successfully the `$scope.users` array will be updated with data from the API.

That's pretty much all the logic we'll need on the client so let's move to the server and open up `api/controllers/UserController.js`. This file (along with `api/models/user.js`) is automatically generated when you run `$ sails generate api User`. Add the following method to handle the client's data request:

```js
module.exports = {
  index: function (req, res, next) {

    // get all users
    User.find(function usersFound (err, users) {

      if (err) return next(err);

      return res.send(200, {
        users: users
      });
    });
  }
}
```

Finally, we need to display this data on the page. We'll use the `templates/users.html` template for this:

```html
<ul>
  <li ng-repeat="user in users">
    {{ user.id }} - {{ user.username }}
  </li>
</ul>
```

If you navigate to [http://localhost:1337/#/app/user](http://localhost:1337/#/app/user) you should see a list of users. Nice work! ⛵

### Resources

- [angularSails](http://balderdashy.github.io/angularSails/#/api/ngsails.$sailsSocket)
- [Angular Controllers](http://toddmotto.com/rethinking-angular-js-controllers/)
- [Angular Services](https://docs.angularjs.org/guide/services)
- [Angular Directives](http://www.sitepoint.com/practical-guide-angularjs-directives/)
- [Angular Filters](http://toddmotto.com/everything-about-custom-filters-in-angular-js/)

Any questions leave a comment! &darr;
