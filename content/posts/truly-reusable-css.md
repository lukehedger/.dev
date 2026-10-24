---
title: Truly reusable CSS
description: ''
publishDate: '2017-02-17'
tags:
  - design
  - web-development
  - css
  - css-in-js
source: Medium
originalUrl: 'https://medium.com/@level_out/truly-reusable-css-f9399e66d40a'
---

CSS at scale is plagued by well-documented problems: consistency, maintainability, dependencies. I’m sure specificity is a word that was invented specifically for describing CSS. Various attempts have been made to solve these problems: BEM, ITCSS and others.

The explosion in popularity of CSS-in-JS creates some interesting opportunities for improving the DX around styling websites. At [Unlease](https://www.unlease.io/), we recently experimented with one implementation of CSS-in-JS: [styled-components](https://styled-components.com/) from [Glen Maddern](https://medium.com/u/59124a41bb46) and [Max Stoiber](https://medium.com/u/908fb8fea30c). This coincided with research surrounding the concept of [Pure UI](https://rauchg.com/2015/pure-ui) and [functional CSS](http://www.jon.gold/2015/07/functional-css/).

As [Jon Gold](https://medium.com/u/5056df9f86a9) puts it:

> You should get away from component-based CSS, which is crappy and repetitive.

Without loads of feature-specific styles, which may be conflicting, duplicated or redundant, a lot of the problems of CSS at scale simply disappear.

### Get all your styles in a row

All this thinking inspired me to the radical idea of building a website that **only has reusable components**. The aim was to have low-level, reusable components and higher-level views that would be composed of a stack of these components. Sort of like having just the Atoms part of [Atomic Design](http://bradfrost.com/blog/post/atomic-web-design/). This would ensure the UI is kept consistent and the underlying CSS maintainable.

A reusable component would look something like this:

```
import styled from 'styled-components'
import Atomic from 'style/atomic'

export const Text = styled.p`
  color: black;
  ${ ({ atomic }) => Atomic({ ...Text.default.atomic, ...atomic }) }
`

Text.default = {
  atomic: {
    fs: 4,
    mt: 4,
    mb: 4,
    ta: 'l',
  },
}
```

And be used like this:

```
<Text atomic={{ fs:5, ta:'c' }}>
  Hello
</Text>
```

You can see an example of the how the Atomic part is [implemented here](https://github.com/ShandyClub/shandy-club/blob/master/app/universal/shared/style/atomic.js).

### Constraints breed creativity

The constraint of using only reusable components breeds creativity. How can you make the small set of components you have simple yet powerful and how can these be used to compose full, well-designed interfaces.

One side-effect is the views or containers that are composed of these components become quite large, as there are no components scoped to specific features or pages — Molecules in Atomic Design.

In this case, it is perfectly acceptable to add domain-specific components that are composed entirely of reusable presentational components. However, it is vital that these components have no style of their own so as to preserve the centrally maintainable CSS that is at the core of this solution.

By preserving a small set of styled components confined to a single project directory, building and refactoring UIs becomes a breeze.

To explore these ideas further take a look at these exciting projects:

-   [jxnblk/cxs](https://github.com/jxnblk/cxs)
-   [chantastic/minions](https://github.com/chantastic/minions.css)
-   [jongold/st](https://github.com/jongold/st)
