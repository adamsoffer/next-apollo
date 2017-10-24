import withApollo from './withApollo'
import withApolloAndRedux from './withApolloAndRedux'

export default (apolloConfig, ComposedComponent) => {
  if (apolloConfig.hasOwnProperty('reducers')) {
    return withApolloAndRedux(apolloConfig, ComposedComponent)
  }
  return withApollo(apolloConfig, ComposedComponent)
}
