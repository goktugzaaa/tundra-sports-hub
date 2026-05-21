import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from './logger';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-wide error boundary. Catches render-time crashes, routes them to
 * the logger, and shows a graceful fallback instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('react.boundary', error.message, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="access-denied">
          <div className="lock">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button className="btn btn-primary" onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
