# Next Apollo [![Build Status](https://travis-ci.org/adamsoffer/next-apollo.svg?branch=master)](https://travis-ci.org/adamsoffer/next-apollo)
A package for using Apollo within a Next.js application.

[Demo](https://next-with-apollo.vercel.app/)

## Installation

This project assumes you have react, react-dom, and next installed. They're specified as peerDependencies.

```
npm install --save next-apollo graphql @apollo/client
```

## Documentation

Create an Apollo Client, pass it into to the `withApollo` higher-order component and export the returned component.

```jsx
import { withApollo } from "next-apollo";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const apolloClient = new ApolloClient({
  uri: "https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn",
  cache: new InMemoryCache(),
});

export default withApollo(apolloClient);
```

Inside your Next.js page, wrap your component with your exported higher order component.

```jsx
import withApollo from "../lib/apollo";

const Page = (props) => <div>Hello World</div>;

// Default export is required for Fast Refresh
export default withApollo({ ssr: true })(Page);
```

That's it!

## How Does It Work?

Next-apollo integrates Apollo seamlessly with Next by wrapping our pages inside a higher-order component (HOC). Using a HOC pattern we're able to pass down a central store of query result data created by Apollo into our React component hierarchy defined inside each page of our Next application.

On initial page load, while on the server and inside `getInitialProps`, the Apollo method, `getDataFromTree`, is invoked and returns a promise; at the point in which the promise resolves, our Apollo Client store is completely initialized.

## License

MIT
