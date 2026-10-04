import { Component } from 'react'
import { ErrorState } from './ui'

/**
 * Keeps one broken page from taking the whole workspace down: the navigation stays usable and the page offers a retry.
 * A failed lazy chunk (an old tab after a deploy) reloads the app instead, since a retry can't fetch it.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) {
    if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error?.message ?? '')) window.location.reload()
    else console.error(error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page">
        <ErrorState title="This page didn't load" text="The rest of your workspace is fine. Try the page again, or pick another section." onRetry={() => this.setState({ error: null })} />
      </div>
    )
  }
}
