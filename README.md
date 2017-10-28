Next Apollo [![Build Status](https://travis-ci.org/ads1018/next-apollo.svg?branch=master)](https://travis-ci.org/ads1018/next-apollo)
=========================
## Installation
```
npm install --save next-apollo
```

## Documentation
Create an Apollo configuration file. Check out the [Apollo Client API](http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.constructor) for more options.

```jsx
import { createNetworkInterface } from 'react-apollo'

export default {
  options: {
    networkInterface: createNetworkInterface({
      uri: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn',
      opts: {
        credentials: 'same-origin'
      }
    })
  }
}
```
Inside your Next.js page, wrap your component with the `withData` higher order component and pass it your configuration object.

```jsx
import { withData } from 'next-apollo'
import config from '../lib/apollo'

export default withData(config, props => (
  <MyPage>Hello World</MyPage>
))

```
That's it!

### Redux integration
By default, Apollo Client creates its own internal Redux store to manage queries and their results. If you are already using Redux for the rest of your app, you can have the client integrate with your existing store instead by simply passing your reducers to your Apollo configuration object.

```jsx
import { createNetworkInterface } from 'react-apollo'
import reducers from './reducers'

export default {
  reducers,
  options: {
    networkInterface: createNetworkInterface({
      uri: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn',
      opts: {
        credentials: 'same-origin'
      }
    })
  }
}

```

## How Does It Work?

Next-apollo integrates Apollo seamlessly with Next by wrapping our pages inside a higher-order component (HOC). Using a HOC pattern we're able to pass down a central store of query result data created by Apollo into our React component hierarchy defined inside each page of our Next application.

On initial page load, while on the server and inside `getInitialProps`, the Apollo method, `getDataFromTree`, is invoked and returns a promise; at the point in which the promise resolves, our Apollo Client store is completely initialized.

## License

MIT
