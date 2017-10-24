Next Apollo
=========================
React higher-order component for using the Apollo GraphQL client inside [Next](https://github.com/reactjs/redux).

## Installation
```
npm install --save next-apollo
```

## Documentation


## How Does It Work?

Next-apollo integrates Apollo seamlessly with Next by wrapping our pages inside a higher-order component (HOC). Using a HOC pattern we're able to pass down a central store of query result data created by Apollo into our React component hierarchy defined inside each page of our Next application.

On initial page load, while on the server and inside getInitialProps, the Apollo method getDataFromTree, gets invoked and returns a promise; at the point in which the promise resolves, our Apollo Client store is completely initialized.

## License

MIT
