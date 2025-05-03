"use client"

import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    console.error("[ErrorBoundary] Caught error:", error)
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Error details:", {
      error,
      componentStack: errorInfo.componentStack
    })
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                console.log("[ErrorBoundary] Attempting to recover")
                this.setState({ hasError: false, error: null })
              }}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
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