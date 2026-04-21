import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WebGpuRequiredNotice } from './WebGpuRequiredNotice'
import { getWebGpuSupportMessage } from '../rendering/webgpuSupport'

type Props = {
  children: ReactNode
  title?: string
}

type State = {
  error: Error | null
}

export class RendererErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    if (this.state.error) {
      return (
        <WebGpuRequiredNotice
          title={this.props.title ?? 'Rendering unavailable'}
          message={getWebGpuSupportMessage(this.state.error)}
        />
      )
    }

    return this.props.children
  }
}
