# Next Apollo [![Build Status](https://travis-ci.org/adamsoffer/next-apollo.svg?branch=master)](https://travis-ci.org/adamsoffer/next-apollo)

A package for using Apollo within a Next.js application.

Note:
This package is ideal if you want to tuck away all the ceremony involved when using Apollo in a Next.js app. It's also ideal if you prefer to use Apollo explicitly on a _page-by-page_ basis, as it requires you to wrap each page that uses Apollo in a HOC. If you prefer to use Apollo implicitly on every page, I recommend taking a look at the [`with-apollo` example](https://github.com/zeit/next.js/tree/canary/examples/with-apollo) in the next.js repo.

## Installation

Note this project assumes you have react, react-dom, and next installed. They're specified as peerDependencies.

```
npm install --save next-apollo graphql react-apollo
```

## Documentation

Create an Apollo configuration object (check out the [Apollo Client API](https://www.apollographql.com/docs/react/basics/setup.html#ApolloClient) for more configuration options). Pass the configuration object to the `withData` higher-order component and export the returned component.

```jsx
import { withData } from 'next-apollo'
import { HttpLink } from 'apollo-link-http'

// can also be a function that accepts a `context` object (SSR only) and returns a config
const config = {
  link: new HttpLink({
    credentials: 'same-origin', // Additional fetch() options like `credentials` or `headers`
    uri: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn', // Server URL
  })
}

export default withData(config)
```

Inside your Next.js page, wrap your component with your exported higher order component.

```jsx
import withData from '../lib/apollo'

export default withData(props => <div>Hello World</div>)
```

That's it!

## How Does It Work?

Next-apollo integrates Apollo seamlessly with Next by wrapping our pages inside a higher-order component (HOC). Using a HOC pattern we're able to pass down a central store of query result data created by Apollo into our React component hierarchy defined inside each page of our Next application.

On initial page load, while on the server and inside `getInitialProps`, the Apollo method, `getDataFromTree`, is invoked and returns a promise; at the point in which the promise resolves, our Apollo Client store is completely initialized.

## Custom Cache

SSR will cease to function if you pass in your own Cache.
It is highly suggested that you do not pass in your own Cache in
the config unless you want it to drop the SSR functionality.

Instead, to use a custom cache, pass in a `createCache` function.
For example, to use a cache with [fragment matching],

```jsx
import { withData } from 'next-apollo'
import { HttpLink } from 'apollo-link-http'
import {
  InMemoryCache,
  IntrospectionFragmentMatcher
} from 'apollo-cache-inmemory'

import introspectionQueryResultData from './fragmentTypes'

const createCache = () => {
  const fragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData
  })

  return new InMemoryCache({ fragmentMatcher })
}

const config = {
  link: new HttpLink({
    uri: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn'
  }),
  createCache
}

export default withData(config)
```

[fragment matching]: https://www.apollographql.com/docs/react/recipes/fragment-matching.html

## Data Prefetching
This package uses a variation of ScaleAPI's [data prefetching technique](https://github.com/scaleapi/data-prefetch-link) tweaked slightly to work with apollo data. We extend the Next `<Link>` component to allow the invocation of `getDataFromTree` when prefetching a page. 

Declarative prefetching example:

```jsx
import { Link } from 'next-apollo'

<Link prefetch withData href="…">
  <a>Some dynamic page</a>
</Link>
```

Imperative prefetching example:
```jsx
import { Link, prefetch } from 'next-apollo'

<Link href="…">
  <a onMouseOver={() => prefetch('...')}>
    Some dynamic page
  </a>
</Link>
```

## License

MIT
