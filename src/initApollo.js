import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'isomorphic-fetch'
import isFunction from 'lodash.isfunction'

let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

const createDefaultCache = () => new InMemoryCache()

function create(apolloConfig, initialState) {
  const createCache = apolloConfig.createCache || createDefaultCache

  const config = {
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    cache: createCache().restore(initialState || {}),
    ...apolloConfig
  }

  delete config.createCache

  return new ApolloClient(config)
}

export default function initApollo(apolloConfig, initialState, ctx) {
  if (isFunction(apolloConfig)) {
    apolloConfig = apolloConfig(ctx)
  }
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(apolloConfig, initialState)
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(apolloConfig, initialState)
  }

  return apolloClient
}
