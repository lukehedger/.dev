---
title: Everything is a Component
description: ''
publishDate: '2018-08-29'
tags:
  - the-pit-of-conditionals
  - application-architecture
  - components
  - react
  - javascript
source: Medium
originalUrl: 'https://medium.com/@level_out/everything-is-a-component-cf9f469ad981'
---

![](/images/everything-is-a-component/1.jpg)

_“gray sand turtle” by [Gary Bendig](https://unsplash.com/@kris_ricepees?utm_source=medium&utm_medium=referral) on [Unsplash](https://unsplash.com?utm_source=medium&utm_medium=referral)_

Directory structure is the new semicolon.

Since [Prettier](https://prettier.io/) solved the [“semicolon or not” debate](https://www.reddit.com/r/ProgrammerHumor/comments/707goi/javascript_semicolon/), we now like to endlessly debate the structure of our JavaScript applications. Is it scalable? Is it semantic? Does it matter?

There are many flavours of application architecture, each derived from personal preference as much as efficiency or practicality. We’ve separated files [by “type”](https://reactjs.org/docs/faq-structure.html#grouping-by-file-type), [by “feature”](https://jaysoo.ca/2016/02/28/organizing-redux-application/) and a [bit of both](https://github.com/erikras/ducks-modular-redux). Just [search “javascript directory structure”](https://duckduckgo.com/?q=javascript+directory+structure) to see the plethora of opinions.

Ultimately, when designing directory structure, we should ask ourselves: is it simple and does it work?

As [Dan Abramov](https://medium.com/u/a3a8af6addc1) [eloquently puts it](http://react-file-structure.surge.sh/):

> move files around until it feels right

### Centralised architecture

Most of the current approaches to application architecture have one problem in common: centralisation.

[Malte Ubl](https://medium.com/u/7813e6de99d2) wrote a comprehensive article about his experience of [“designing very large applications”](https://medium.com/@cramforce/designing-very-large-javascript-applications-6e013a3291a3).

> The best advice I can give: Don’t let your applications get very large.

Most of his lessons relate to the **centralisation of configuration**. This can also be extended to the **centralisation of components**.

Do you have a single, root-level config.js or constants.js file? Get rid of it. Do you have a folder of “reusable” components? Destroy it.

By removing these centralised dependencies, we **linearise the application’s dependency tree**. UI components no longer import generalised, shared components or config — instead they are built with specific, local components and maintain their own slice of config (or, state).

One of Malte’s main messages is to “make it easier to delete code” — when adding a function or a component to an application, we should consider whether the **code can be removed without impacting other files**. Decentralising dependencies makes this a piece of cake as the amount of code shared across the application is minimal.

### Abstract with care

Abstraction is both a blessing and a curse. Sometimes, our components grow “too big” and we split them up into many smaller components. Other times, a “utility” function is used (or _could_ be useful) in multiple files so we hoist it up to be shared across the application. It’s at these points we have to be careful to make the **right abstraction**.

Over-abstraction of seemingly reusable components is a classic problem in applications that use component-based UI frameworks, like React. The initial intention is always good: “This form could be used everywhere! Now we have one form to maintain rather than loads”. A form may _look_ similar based on UI designs, it may _seem_ to have similar behaviours but quite often this is **coincidence**. What we usually end up with is: “This form needs to accommodate loads of uses! Now we have one form that is difficult to maintain”. We have fallen into **The Pit of Conditionals**.

```
const ThePitOfConditionals = props => {
  return (
    <div>
      {props.shouldWeExplore ? (
        <GoForWalkInFieldOfGreatPower>
          {props.isThatATree ? (
            <OhNoItWasJustGreatResponsibilty>
              {props.hasThisGoneFarEnough ? (
                <Never!>
                  {props.shouldWePeerIntoThatHoleOverThere ? (
                    <Falling>
                      {props.isThatAnEscapeHatch ? (
                        <SetTimeout />
                      ) : (
                        <Falling>
                          {props.hasThisGoneFarEnough ? (
                            <ThePitOfConditionals />
                          ) : (
                            <ThePitOfConditionals />
                          )}
                        </Falling>
                      )}
                    </Falling>
                  ) : <SVGFill />}
                </Never!>
              ) : (
                <Br />
              )}
            </OhNoItWasJustGreatResponsibilty>
          ) : <Image src="tree-mirage.jpg" />}
        </GoForWalkInFieldOfGreatPower>
      ) : (
        <Component />
      )}
    </div>
  )
}
```

### What if components only did one thing?

This tweet holds a lot of truth:

> So much complexity in software comes from trying to make one thing do two things.
>
> — Ryan Singer on Twitter

Components should be discrete; they should only do one thing. This is sometimes confused with the amount of code in a component — as mentioned earlier, when components grow in LOC we tend to see this an abstraction point. Single-purpose (or, “primitive”) components will tend to be smaller but size shouldn’t be used as an indication of complexity.

Take this generalised “Profile” component. It renders a profile image and a username. This profile view is shown in multiple places across the application. It has been abstracted to avoid repeating the same code. However, the component has different requirements when used in different parts of the UI so needs a sprinkling of conditional rendering:

```
const ProfileComponent = props => {
  return (
    <div>
      {props.showAvatar && (
        <img src={props.src} />
      )}
```

```
      {props.showUsername && (
        <p>{props.username}</p>
      )}
    </div>
  )
}
```

It’s pretty dark and narrow in The Pit of Conditionals — making it hard to see how a component should behave based solely on its own code.

We can contrast that with primitive Image and Text components that can be used to compose other components, _on demand_. These primitive components could also have some application-specific styles or theme applied to them to ensure a consistent UI.

```
const Image = props => {
  return (
    <img src={props.src} />
  )
}
```

```
const Text = props => {
  return (
    <p>{props.children}</p>
  )
}
```

```
const Avatar = props => {
  return (
    <Image src={props.avatar} />
  )
}
```

```
const Header = props => {
  return (
    <header>
      <Image src={props.avatar} />
```

```
      <Text>{props.username}</Text>
    </header>
  )
}
```

Primitive components give us _narrowly scoped abstraction_. Pieces of our codebase can still be abstracted but with the safety of simple dependency trees. The abstractions are focused on a specific purpose and so have a narrow scope — ultimately making them easy to delete.

Primitive components **can live anywhere in your directory structure** – near to where they are relevant: in root-level “type” directories like styles/ or in domain-level “feature” directories like ProfilePage/. We can continue to categorise components by type: style, computation, network requests, routes and so on. More on this later.

Oh, and remember when “colocation” [was cool](https://vuejs.org/v2/guide/single-file-components.html) — let’s bring it back. Its fine to mix GraphQL queries with CSS-in-JS and JSX in a single component — as long as that component **does one thing** — like render a username.

```
const usernameTextStyles = css`
  color: #f08f74;
`
```

```
const usernameQuery = gql`
  currentUser {
    id
    username
  }
`
```

```
const Username = () => {
  return (
    <Query query={usernameQuery}>
      {user => (
        <p {...styles(usernameTextStyles)}>{user.username}</p>
      )}
    </Query>
  )
}
```

### What if everything was a component?

In frameworks like React, “components” are first-class citizens — they are the primary (if not only) building block of the application. So why separate them into their own areas of the directory structure, like generalised components/ folders? They should be at the core of every level and area of the application’s architecture. **They should be everywhere**.

If we classify components by their type, we could have “utility components”, [“query components”](https://www.apollographql.com/docs/react/essentials/get-started.html#request), [“style components”](https://github.com/jaakmusic/primitives). A lot of projects already do this with [“container components”](https://redux.js.org/basics/usagewithreact#designing-container-components) and, increasingly, [“context components”](https://reactjs.org/docs/context.html#consuming-context-with-a-hoc).

Let’s take a utility component as an example. Usually, utilities are functions that take some data as an input, process it according to some rules and return the processed data:

```
const getAvatar = userId => `images/avatars/${userId}.jpg`
```

```
// Meanwhile, elsewhere in the application...
```

```
import getAvatar from 'utils/getAvatar'
```

```
const Avatar = props => {
  return (
    <img src={getAvatar(props.userId)} />
  )
}
```

By **turning this utility function into a component**, our code becomes easier to reason about:

```
const GetAvatar = props => {
  return props.children(`images/avatars/${props.userId}.jpg`)
}
```

```
const Avatar = props => {
  return (
    <GetAvatar userId={props.userId}>
      {avatar => <img src={avatar} />}
    </GetAvatar>
  )
}
```

The main benefits of making everything a component are:

-   **Applications have a single building material: composition.** This simplifies the UI’s API — components just use other components to render elements to the DOM. No more obscure utility functions, over-use of lifecycle methods to compute state or risk of side-effects (like functions in render).
-   **Memoization for free.** By leveraging built-in tools like shouldComponentUpdate and PureComponent we don’t need to worry about memoizing our computed data functions.
-   **Standard patterns.** Familiar conventions for writing components like [render props](https://reactjs.org/docs/render-props.html) and [HOCs](https://reactjs.org/docs/higher-order-components.html) can help us to reason about our code.
-   **Testing**. As components are completely serialisable as JSON, testing most of the units in the application will be as simple as using a [Jest snapshot](https://jestjs.io/docs/en/snapshot-testing).

We are still free to structure our applications in whatever way works for our teams and call folders whatever names make sense to us. But when doing so, we’ve seen how it could be useful to minimise the centralisation of dependencies and prefer (primitive) components for all units of your applications, from presentation to business logic.

Let’s keep moving things around until they feel right!

#### The Everything is a Component Checklist:

_Next time you write a piece of code, ask:_

-   What would the code look like as a component?
-   Does the component do one thing?
-   Could the component be composed of other primitive components?
-   Does abstracting parts of the component reduce or introduce complexity?
