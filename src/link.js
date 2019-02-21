import React from 'react'
import PropTypes from 'prop-types'
import Link from 'next/link'
import Router from 'next/router'
import { getDataFromTree } from 'react-apollo'
import { execOnce } from 'next-server/dist/lib/utils'
import exact from 'prop-types-exact'
import { format, resolve, parse } from 'url'

export const prefetch = async href => {
  // if  we're running server side do nothing
  if (!process.browser) return

  const url = typeof href !== 'string' ? format(href) : href
  const { pathname } = window.location
  const parsedHref = resolve(pathname, url)
  const { query } = typeof href !== 'string' ? href : parse(url, true)
  const Component = await Router.prefetch(parsedHref)

  // if Component exists and has getInitialProps
  // fetch the component props (the component should save it in cache)
  if (Component && Component.getInitialProps) {
    const ctx = { pathname: href, query, isVirtualCall: true }
    const composedInitialProps = await Component.getInitialProps(ctx)
    await getDataFromTree(<Component ctx={ctx} {...composedInitialProps} />, {
      router: {
        asPath: ctx.asPath,
        pathname: ctx.pathname,
        query: ctx.query
      }
    })
  }
}

// extend default next/link to customize the prefetch behaviour
export default class LinkWithData extends Link {
  // re defined Link propTypes to add `withData`
  static propTypes = exact({
    href: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    as: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    prefetch: PropTypes.bool,
    replace: PropTypes.bool,
    shallow: PropTypes.bool,
    passHref: PropTypes.bool,
    scroll: PropTypes.bool,
    children: PropTypes.oneOfType([
      PropTypes.element,
      (props, propName) => {
        const value = props[propName]

        if (typeof value === 'string') {
          const warn = execOnce(console.error)
          warn(
            `Warning: You're using a string directly inside <Link>. This usage has been deprecated. Please add an <a> tag as child of <Link>`
          )
        }

        return null
      }
    ]).isRequired,
    withData: PropTypes.bool // our custom prop
  })

  // our custom prefetch method
  async prefetch() {
    // if the prefetch prop is not defined do nothing
    if (!this.props.prefetch) return

    // if withData prop is defined
    // prefetch with data
    // otherwise just prefetch the page
    if (this.props.withData) {
      prefetch(this.props.href)
    } else {
      super.prefetch()
    }
  }
}
