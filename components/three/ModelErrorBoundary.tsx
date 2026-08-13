'use client'

import { Component, type CSSProperties, type ReactNode } from 'react'

type ModelErrorBoundaryProps = {
  children: ReactNode
  /** Filename shown in the fallback, e.g. `Gazebo.6.4.1.glb`. */
  modelName: string
  /** Optional styles for the fallback container (match canvas size). */
  style?: CSSProperties
  className?: string
}

type ModelErrorBoundaryState = {
  error: Error | null
}

/**
 * Catches GLTF / Canvas load failures that R3F rethrows into the DOM tree.
 * Without this, a missing `.glb` takes down the whole page.
 */
export default class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  state: ModelErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className={this.props.className}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...this.props.style,
          }}
          role="alert"
        >
          <p style={{ margin: 0, textAlign: 'center' }}>
            3D model: &apos;{this.props.modelName}&apos; not found
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
