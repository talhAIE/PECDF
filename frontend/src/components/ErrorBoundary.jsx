import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white border border-red-200 rounded-xl p-6 shadow">
            <h2 className="text-lg font-bold text-red-700 mb-2">Page crashed — error details:</h2>
            <pre className="text-xs text-red-600 bg-red-50 rounded p-4 overflow-auto whitespace-pre-wrap break-all">
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
