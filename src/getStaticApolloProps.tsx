import { ParsedUrlQuery } from 'querystring'

import { ApolloClient, ApolloProvider } from '@apollo/client'
import { GetStaticProps } from 'next'
import type { NextRouter } from 'next/dist/next-server/lib/router/router'
import React from 'react'

export type StaticApolloProps = {
  apolloState: object
  generatedAt: string
  revalidate?: number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notImplemented = (..._args: any): any => {
  throw new Error("Can't be called from a static page")
}

const baseFakeRouter = {
  route: '',
  pathname: '',
  asPath: '',
  basePath: '',
  push: notImplemented,
  replace: notImplemented,
  reload: notImplemented,
  back: notImplemented,
  prefetch: notImplemented,
  beforePopState: notImplemented,
  events: {
    on: notImplemented,
    off: notImplemented,
    emit: notImplemented
  },
  isFallback: false,
  isReady: false,
  isLocaleDomain: false,
  isPreview: false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStaticApolloProps = (apolloClient: ApolloClient<any>) => <
  TParams extends ParsedUrlQuery = ParsedUrlQuery
>(
  Page: React.ComponentType<{}>,
  { revalidate }: { revalidate?: number } = {}
): GetStaticProps<StaticApolloProps, TParams> => {
  return async (context) => {
    const { params, locales, locale, defaultLocale } = context
    // https://github.com/vercel/next.js/blob/48acc479f3befb70de800392315831ed7defa4d8/packages/next/next-server/lib/router/router.ts#L250-L259
    const router: NextRouter = {
      query: params as ParsedUrlQuery,
      locales,
      locale,
      defaultLocale,
      ...baseFakeRouter
    }

    const { getDataFromTree } = await import('@apollo/client/react/ssr')
    const { RouterContext } = await import(
      'next/dist/next-server/lib/router-context'
    )

    const PrerenderComponent = () => (
      <ApolloProvider client={apolloClient}>
        <RouterContext.Provider value={router}>
          <Page />
        </RouterContext.Provider>
      </ApolloProvider>
    )

    await getDataFromTree(<PrerenderComponent />)

    return {
      props: {
        apolloState: apolloClient.cache.extract(),
        generatedAt: new Date().toISOString(),
        revalidate: revalidate || null,
        clearCacheOnPageEntry: true
      },
      revalidate
    }
  }
}

export default getStaticApolloProps;
