import { Component, type ReactNode } from "react";

type State = { error: string | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return <div className="status-banner error">Application error: {this.state.error}</div>;
    }
    return this.props.children;
  }
}
