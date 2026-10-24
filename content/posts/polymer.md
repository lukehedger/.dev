---
title: Polymer
description: Welcome to the future
publishDate: '2014-09-11'
tags:
  - polymer
  - web-components
  - hello-world
source: level-out.com
---

A window into the future; a future where web components live equally amongst all the other members of the markup world. Polymer allows you to use bleeding-edge features like HTML Imports and the mysterious-sounding Shadow DOM. Now!

##### Getting started

Getting up and running with Polymer is fairly simple. You could do some background [reading](http://www.polymer-project.org/docs/start/everything.html) or [viewing](https://www.youtube.com/watch?v=irGDN5Ysi_A&list=PLRAVCSU_HVYu-zlRaqArF8Ytwz1jlMOIM) or jump straight into [creating a Polymer app](http://www.polymer-project.org/docs/start/tutorial/intro.html).

I recommend having a poke around the docs and following the Polymer tutorial to get acquainted with its concepts and syntax. I've put a [commented-version of the Polymer tutorial app](https://github.com/lukehedger/hello-polymer) on GitHub if you like that sort of thing.

##### A Polymer project

The aim of this article is to move on from the official tutorial and help you create a fresh Polymer project with a few Polymer components in - plus some custom elements of your own!

So, go ahead and set up a new project with all your fave tools in as normal. You can give my homemade frontend framework - [Bayse](https://github.com/lukehedger/bayse) - a go if you like.

##### Bower

If you haven't used Bower before you can get the lowdown at [bower.io](http://bower.io/). Its basically a package manager for the browser. Polymer uses it to house components.

Install bower:
```bash
$ npm install -g bower
```

You'll need to create a `bower.json` file in your project root:
```bash
$ cd your-project
$ bower init
```

Next, install Polymer:
```bash
$ bower install --save Polymer/polymer
# that --save flag will add the package as a dependancy in your bower.json file
```

Installing your first Bower package will also create a `bower_components` directory. To give it that extra Polymer-flavour you can rename this to simply `components`. If you choose to do this you'll also need to add a file called `.bowerrc` in the root of your project with this in:
```json
{
  "directory": "components"
}
```

All other Polymer packages can be installed in the same way, for example the `paper-elements`:
```bash
$ bower install Polymer/paper-elements
```

##### Material design

Okay, [enough about Bower](http://media.giphy.com/media/HwbdM9tzgX3a0/giphy.gif). But just a little bit about something else indirectly related: Polymer's ["paper" elements](http://www.polymer-project.org/components/paper-elements/demo.html) are examples of Google's [Material design](http://www.google.com/design/spec/material-design/introduction.html). You can be double-efficient and try out building a [Material interface whilst playing with Polymer](http://www.polymer-project.org/docs/elements/material.html). Google have also recently released their [Web Starter Kit](https://developers.google.com/web/starter-kit/) so you could be triple-efficient and bolt Polymer on to this.

##### HTML Imports

And so, onto Polymer. HTML Imports are like native "includes". You simply include any HTML files you damn well like using the `<link>` tag. Since Polymer components and custom elements are usually bundled into single HTML files, this works perfectly for them but you could viably use Imports in regular web apps instead of PHP includes and the like.

```html
<link rel="import" href="../components/font-roboto/roboto.html">   
```

##### Elements

Within these element HTML files, you'll need a couple of standard things:

+ Polymer - `<link rel="import" href="../components/polymer/polymer.html">`
+ The element itself - `<polymer-element name="test-element"></polymer-element>`

I'd recommend saving your elements within an `elements` directory using the same naming convention as the elements themselves: `name-element`.

###### Components vs Elements

A note on the difference between components and elements:

+ **Components** are custom elements that are bundled for release with a host of other config/readme files and published on Bower. You will likely use other people's components in your project for common elements like inputs and buttons.
+ **Elements** are app-specific custom elements that are created by you, the app author, which usually consist of a single HTML file with encapsulated CSS and JavaScript. These elements are still reusable across projects and can be [published to Bower](http://www.polymer-project.org/docs/start/reusableelements.html).

##### Data binding

Polymer's [data binding](http://www.polymer-project.org/docs/polymer/binding-types.html) and [templating](http://www.polymer-project.org/docs/polymer/template.html) is everything you'd expect from another templating language. I won't go into detail on this as there's much better info on the site but here's one example:

Say you've got an array called `arr` defined on your element you can loop through this and print out the items really easily. You can also use conditional statements - where `arrRepeat` is a boolean value on your element:

```html
<template repeat='{{ arr }}' if='{{ arrRepeat }}'>
    <li>{{ }}</li>
</template>
```

There's a load more you can do with [template expressions](http://www.polymer-project.org/docs/polymer/expressions.html).

##### AJAX example

Another cool example of data binding's power is the Polymer [AJAX component](http://www.polymer-project.org/docs/elements/core-elements.html#core-ajax).

Include the component in your custom element:

```html
<link rel="import" href="../components/core-ajax/core-ajax.html">
```

Use it with:
```html
<core-ajax url="../data/holidays.json" auto response='{{ resp }}'></core-ajax>
<!-- setting the auto attribute means the element will perform a request whenever its url or params properties are changed -->
```

```html
<!-- response data is bound to {{ resp }} and can now be used anywhere in the template -->
<p>AJAX data: {{ resp.item }}</p>
```

##### Event binding

Methods defined on your custom element can be bound to elements as events:

```html
<paper-fab icon="android" style="fill:#A4C639;background:white;" id="androidButton" on-tap='{{ eventEg }}'></paper-fab>
```

You'll notice that Polymer has native support for [touch events](http://www.polymer-project.org/docs/polymer/touch.html).

Here's the method defined on the element when passed to the `Polymer()` constructor:

```javascript
Polymer("test-element", {
    eventEg: function(e) {
        console.log(e.type,"on",this.$.androidButton);
    }
});
```

You can also use Polymer's built-in [changed watchers](http://www.polymer-project.org/docs/polymer/polymer.html#change-watchers) to observe property changes on your element:

```javascript
Polymer("test-element", {
    count: 0,
    // change watchers can be assigned to any property of the element using the syntax: propertyNameChanged. This event will fire whenever that property changes
    countChanged: function(oldValue, newValue) {
        console.log("count changed from",oldValue,"to",newValue);
    }
});
```

##### External scripts/CoffeeScript

If you're into CoffeeScript I'll leave you with one last bonus - custom element JavaScript doesn't have to be inline, it can also be in an external file. This can be plain ol' JavaScript but also gives you scope to write your element's script in Coffee. Just bang out the Coffee files, compile them as normal and then reference the compiled JS file in your element:

```html
<script src="../js/elements/test-element.js"></script>
```

I've had a quick go at what a Polymer CoffeeScript file might look like - more as a proof of concept than anything else. As I explore this a bit more I'll come back and update the post. But for now, your Coffee could look something like this:

```coffeescript
class testElement

    @CONSTANT : "Polymer"

    constructor: ->

        console.log 'test-element with coffee!!'

Polymer "test-element",
    author: testElement.CONSTANT
    created: () ->
        console.log "created with coffee by", this.author
    ready: testElement
```

##### Go, build!

Have a go at building a custom element that encompasses all of the main "components" of Polymer (cheeky pun). It doesn't have to look pretty or work like an app, just get the code down and have fun in the process!
