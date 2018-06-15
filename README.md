Next Apollo [![Build Status](https://travis-ci.org/adamsoffer/next-apollo.svg?branch=master)](https://travis-ci.org/adamsoffer/next-apollo)
=========================
## Installation
```
npm install --save next-apollo
```

## Documentation
Create an Apollo configuration object (check out the [Apollo Client API](https://www.apollographql.com/docs/react/basics/setup.html#ApolloClient) for more configuration options). Pass the configuration object to the `withData` higher-order component and export the returned component.

```jsx
import { withData } from 'next-apollo'
import { HttpLink } from 'apollo-link-http'

// can also be a function that accepts a `context` object (SSR only) and returns a config
const config = {
  link: new HttpLink({
    uri: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn', // Server URL (must be absolute)
    opts: {
      credentials: 'same-origin' // Additional fetch() options like `credentials` or `headers`
    }
  })
}

export default withData(config)
```
Inside your Next.js page, wrap your component with your exported higher order component.

```jsx
import withData from '../lib/apollo'

export default withData(props => (
  <div>Hello World</div>
))

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
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'

import introspectionQueryResultData from './fragmentTypes'

const createCache = () => {
  const fragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData
  })

  return new InMemoryCache({fragmentMatcher})
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

## License

MIT
