import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject
} from "@apollo/client";
import { NextPage, NextPageContext } from "next";
import App, { AppContext } from "next/app";
import React from "react";

// On the client, we store the Apollo Client in the following variable.
// This prevents the client from reinitializing between page transitions.
let globalApolloClient: ApolloClient<NormalizedCacheObject> | null = null;

type WithApolloOptions = {
  apolloClient: ApolloClient<NormalizedCacheObject>;
  apolloState: NormalizedCacheObject;
  clearCacheOnPageEntry?: boolean;
};

type ContextWithApolloOptions = AppContext & {
  ctx: { apolloClient: WithApolloOptions["apolloClient"] };
} & NextPageContext &
  WithApolloOptions;

type ApolloClientParam = ApolloClient<NormalizedCacheObject>
  | ((ctx?: NextPageContext) => ApolloClient<NormalizedCacheObject>)

/**
 * Installs the Apollo Client on NextPageContext
 * or NextAppContext. Useful if you want to use apolloClient
 * inside getStaticProps, getStaticPaths or getServerSideProps
 * @param {NextPageContext | AppContext} ctx
 */
export const initOnContext = (
  acp: ApolloClientParam,
  ctx: ContextWithApolloOptions
) => {
  const ac = typeof acp === 'function' ? acp(ctx) : acp as ApolloClient<NormalizedCacheObject>;
  const inAppContext = Boolean(ctx.ctx);

  // We consider installing `withApollo({ ssr: true })` on global App level
  // as antipattern since it disables project wide Automatic Static Optimization.
  if (process.env.NODE_ENV === "development") {
    if (inAppContext) {
      console.warn(
        "Warning: You have opted-out of Automatic Static Optimization due to `withApollo` in `pages/_app`.\n" +
        "Read more: https://err.sh/next.js/opt-out-auto-static-optimization\n"
      );
    }
  }

  // Initialize ApolloClient if not already done
  const apolloClient =
    ctx.apolloClient ||
    initApolloClient(ac, ctx.apolloState || {}, inAppContext ? ctx.ctx : ctx, false);

  // We send the Apollo Client as a prop to the component to avoid calling initApollo() twice in the server.
  // Otherwise, the component would have to call initApollo() again but this
  // time without the context. Once that happens, the following code will make sure we send
  // the prop as `null` to the browser.
  (apolloClient as ApolloClient<NormalizedCacheObject> & {
    toJSON: () => { [key: string]: any } | null;
  }).toJSON = () => null;

  // Add apolloClient to NextPageContext & NextAppContext.
  // This allows us to consume the apolloClient inside our
  // custom `getInitialProps({ apolloClient })`.
  ctx.apolloClient = apolloClient;
  if (inAppContext) {
    ctx.ctx.apolloClient = apolloClient;
  }

  return ctx;
};

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param  {NormalizedCacheObject} initialState
 * @param  {NextPageContext} ctx
 */
const initApolloClient = (
  acp: ApolloClientParam,
  initialState: NormalizedCacheObject,
  ctx: NextPageContext | undefined,
  clearCache: boolean,
) => {
  const apolloClient = typeof acp === 'function' ? acp(ctx) : acp as ApolloClient<NormalizedCacheObject>;

  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (typeof window === "undefined") {
    return createApolloClient(apolloClient, initialState, ctx);
  }

  if (clearCache) globalApolloClient = null;

  // Reuse client on the client-side
  if (!globalApolloClient) {
    globalApolloClient = createApolloClient(apolloClient, initialState, ctx);
  }

  return globalApolloClient;
};

/**
 * Creates a withApollo HOC
 * that provides the apolloContext
 * to a next.js Page or AppTree.
 * @param  {Object} ac
 * @param  {Boolean} [withApolloOptions.ssr=false]
 * @returns {(PageComponent: NextPage<P>) => ComponentClass<P> | FunctionComponent<P>}
 */
export default function withApollo<P, IP>(ac: ApolloClientParam) {
  return ({ ssr = false } = {}) => (PageComponent: NextPage<P, IP>) => {
    const WithApollo = (pageProps: P & WithApolloOptions) => {
      let client: ApolloClient<NormalizedCacheObject>;
      if (pageProps.apolloClient) {
        // Happens on: getDataFromTree & next.js ssr
        client = pageProps.apolloClient;
      } else {
        // Happens on: next.js csr
        client = initApolloClient(ac, pageProps.apolloState, undefined, !!pageProps.clearCacheOnPageEntry);
      }

      return (
        <ApolloProvider client={client}>
          <PageComponent {...pageProps} />
        </ApolloProvider>
      );
    };

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== "production") {
      const displayName =
        PageComponent.displayName || PageComponent.name || "Component";
      WithApollo.displayName = `withApollo(${displayName})`;
    }

    if (ssr || PageComponent.getInitialProps) {
      WithApollo.getInitialProps = async (ctx: ContextWithApolloOptions) => {
        const inAppContext = Boolean(ctx.ctx);
        const { apolloClient } = initOnContext(ac, ctx);

        // Run wrapped getInitialProps methods
        let pageProps = {};
        if (PageComponent.getInitialProps) {
          pageProps = await PageComponent.getInitialProps(ctx);
        } else if (inAppContext) {
          pageProps = await App.getInitialProps(ctx);
        }

        // Only on the server:
        if (typeof window === "undefined") {
          const { AppTree } = ctx;
          // When redirecting, the response is finished.
          // No point in continuing to render
          if (ctx.res && ctx.res.writableEnded) {
            return pageProps;
          }

          // Only if dataFromTree is enabled
          if (ssr && AppTree) {
            try {
              // Import `@apollo/react-ssr` dynamically.
              // We don't want to have this in our client bundle.
              const { getDataFromTree } = await import(
                "@apollo/client/react/ssr"
              );

              // Since AppComponents and PageComponents have different context types
              // we need to modify their props a little.
              let props;
              if (inAppContext) {
                props = { ...pageProps, apolloClient };
              } else {
                props = { pageProps: { ...pageProps, apolloClient } };
              }

              // Take the Next.js AppTree, determine which queries are needed to render,
              // and fetch them. This method can be pretty slow since it renders
              // your entire AppTree once for every query. Check out apollo fragments
              // if you want to reduce the number of rerenders.
              // https://www.apollographql.com/docs/react/data/fragments/

              // TypeScript fails this check for some reason.
              // <AppInitialProps & {[name: string]: any;}> should be alright.
              // @ts-ignore
              await getDataFromTree(<AppTree {...props} />);
            } catch (error) {
              // Prevent Apollo Client GraphQL errors from crashing SSR.
              // Handle them in components via the data.error prop:
              // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
              console.error("Error while running `getDataFromTree`", error);
            }

            // getDataFromTree does not call componentWillUnmount
            // head side effect therefore need to be cleared manually
          }
        }

        return {
          ...pageProps,
          // Extract query data from the Apollo store
          apolloState: apolloClient.cache.extract(),
          // Provide the client for ssr. As soon as this payload
          // gets JSON.stringified it will remove itself.
          apolloClient: ctx.apolloClient,
        };
      };
    }

    return WithApollo;
  };
};

const createApolloClient = (
  acp: ApolloClientParam,
  initialState: NormalizedCacheObject,
  ctx: NextPageContext | undefined
) => {
  const apolloClient = typeof acp === 'function' ? acp(ctx) : acp as ApolloClient<NormalizedCacheObject>;
  // The `ctx` (NextPageContext) will only be present on the server.
  // use it to extract auth headers (ctx.req) or similar.
  (apolloClient as ApolloClient<NormalizedCacheObject> & {
    ssrMode: boolean;
  }).ssrMode = Boolean(ctx);
  apolloClient.cache.restore(initialState);

  return apolloClient;
};
