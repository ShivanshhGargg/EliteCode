import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-neon-red" />
            </div>
            <h2 className="text-2xl font-bold text-txt-primary">Something broke</h2>
            <p className="text-sm text-txt-secondary">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan/10 border border-cyan/30 rounded-xl text-cyan text-sm font-medium
                hover:bg-cyan/20 hover:shadow-glow-sm transition-all duration-300"
            >
              <RotateCcw size={16} /> Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
