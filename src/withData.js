import React, { useMemo } from 'react'
import Head from 'next/head'
import { ApolloProvider } from '@apollo/react-hooks'
import { ApolloClient, InMemoryCache, HttpLink } from 'apollo-boost'
import fetch from 'isomorphic-unfetch'

let apolloClient = null

const createDefaultCache = () => new InMemoryCache()

export default apolloConfig => {
  return (PageComponent, { ssr = true } = {}) => {
    const WithApollo = ({ apolloClient, apolloState, ...pageProps }) => {
      const client = useMemo(
        () => apolloClient || initApolloClient(apolloConfig, apolloState),
        []
      )
      return (
        <ApolloProvider client={client}>
          <PageComponent {...pageProps} />
        </ApolloProvider>
      )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
      const displayName =
        PageComponent.displayName || PageComponent.name || 'Component'

      if (displayName === 'App') {
        console.warn('This withApollo HOC only works with PageComponents.')
      }

      WithApollo.displayName = `withApollo(${displayName})`
    }

    // Allow Next.js to remove getInitialProps from the browser build
    if (typeof window === 'undefined') {
      if (ssr) {
        WithApollo.getInitialProps = async ctx => {
          const { AppTree } = ctx

          let pageProps = {}
          if (PageComponent.getInitialProps) {
            pageProps = await PageComponent.getInitialProps(ctx)
          }

          // Run all GraphQL queries in the component tree
          // and extract the resulting data
          const apolloClient = initApolloClient(apolloConfig, null)

          try {
            // Run all GraphQL queries
            await require('@apollo/react-ssr').getDataFromTree(
              <AppTree
                pageProps={{
                  ...pageProps,
                  apolloClient
                }}
              />
            )
          } catch (error) {
            // Prevent Apollo Client GraphQL errors from crashing SSR.
            // Handle them in components via the data.error prop:
            // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
            console.error('Error while running `getDataFromTree`', error)
          }

          // getDataFromTree does not call componentWillUnmount
          // head side effect therefore need to be cleared manually
          Head.rewind()

          // Extract query data from the Apollo store
          const apolloState = apolloClient.cache.extract()

          return {
            ...pageProps,
            apolloState
          }
        }
      }
    } else if (PageComponent.getInitialProps) {
      WithApollo.getInitialProps = async ctx => {
        return await PageComponent.getInitialProps(ctx)
      }
    }

    return WithApollo
  }
}

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param  {Object} initialState
 */
function initApolloClient(apolloConfig, initialState = {}) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (typeof window === 'undefined') {
    return createApolloClient(apolloConfig, initialState)
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = createApolloClient(apolloConfig, initialState)
  }

  return apolloClient
}

/**
 * Creates and configures the ApolloClient
 * @param  {Object} [initialState={}]
 */
function createApolloClient(apolloConfig, initialState = {}) {
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
