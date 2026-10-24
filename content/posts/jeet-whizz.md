---
title: Jeet Whizz
description: >-
  It may sound like a cross between insect repellant and a 90s cream cleaner but
  Jeet is, in fact, a super-intelligent CSS grid system.
publishDate: '2015-02-04'
tags:
  - css
source: level-out.com
---

### Feel griddy all over

[Jeet](http://jeet.gs/) sets your grids free and allows you to build robust structures entirely in your stylesheet, away from your markup.

> No more needlessly nesting elements. No more rigid twelve column rules. Enjoy building faster with less code, and more flexibility with Jeet.

### Meet Jeet

Jeet describes itself as a "human grid", which means simple, natural syntax is at its core. The API is actually very light (but powerful), making it quick and easy to get started.

```css
article
    col(2/3)

aside
    col(1/3)
```

Have a look at the "Getting Started" and "Basic Usage" video tutorials on [jeet.gs](http://jeet.gs/) to get a solid overview of the possibilities.

### For better...

Jeet is designed for use with CSS preprocessors - specifically SASS and Stylus. This allows it to leverage the power of mixins as standard - meaning no markup pollution (think Bootstrap-style classes: `"col-6 desktop-half mobile-full cinema-one-tenth arrgghh"`) and concise, readable, modular CSS. A great example of this is the built-in alignment mixin - no more crazy absolute center hacks AND IE9+ support with just one line:

```css
.aligned
    align()

.vertical
    align(vertical)

.horizontal
    align(horizontal)
```

Another nice trick is the `edit()` mixin. This can be applied to a container element to add a semi-transparent grey background to all child `col()` and `span()` elements - helpful when constructing an initial wireframe of your grid (and saves adding garish `background-colors` to everything). And, thanks to the transparency, you can get a feel for nested grid elements.

One of Jeet's best features is its column's `cycle` attribute, which makes gallery-style grids effortless:

```css
.gallery--desktop
    column(1/4, cycle: 4)

.gallery--mobile
    column(1/2, uncycle: 4, cycle: 2)
```

### For worse...

The project is still relatively raw/young, which could be seen as good and bad. I'd like to see a few more helper mixins (something for variable row heights, for example) but also like Jeet's basic, focussed nature - it's a grid system that enables you to build unobtrusive yet powerful grids, rapidly. A few more community tutorials and examples may also help boost the user-base.

One thing to be aware of is the lack of support for pixel-based gutters - currently, Jeet only supports percentage-based gutters for columns. From a pure responsive development point-of-view this is a good thing but from a pixel-perfect design point-of-view it could be an issue. Just something to bare in mind when selecting Jeet as your grid system - as always, check with your designer 😉

### Give it a go

I would suggest just giving Jeet a go - draw out a simple grid and then try to build it. Bundle it with [Gulp](http://gulpjs.com/) and [Rupture](https://github.com/jenius/rupture) for an awesome CSS workflow:

```js
gulp.task('style', function () {
    gulp.src('./stylus/main.styl')
    .pipe(stylus({
        use: [rupture(), jeet()],
        compress: false
    }))
    .pipe(gulp.dest('css'));
});
```

The Stylus installation steps on the Jeet site are a bit strange - they insist the package is installed globally but this isn't necessary. Instead just install it locally to your project and save the dependency to your `package.json`:

```bash
$ npm install jeet --save
```

### What next?

It seems a major refactored version is [on its way](https://github.com/mojotech/jeet/issues/372#issuecomment-61809596) so - watch this space - Jeet is only going to get better! Plus, Jeet's creator - [corysimmons](https://github.com/corysimmons) - appears to be a grid-fiend and has open-sourced two other grid-systems: [dragon](https://github.com/corysimmons/dragon) and [elf](https://github.com/corysimmons/elf) (which [looks like](http://corysimmons.github.io/elf/) it supports consistent gutter widths with any valid CSS measurement).

I'm off to check both of those out! 💥
