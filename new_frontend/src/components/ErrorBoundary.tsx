import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Prevents the entire app from crashing due to errors in a specific component.
 *
 * 자식 컴포넌트의 JavaScript 오류를 잡아서 대체 UI를 표시합니다.
 * 특정 컴포넌트의 오류로 인해 전체 앱이 충돌하는 것을 방지합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>문제가 발생했습니다</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                페이지를 불러오는 중 오류가 발생했습니다.
                <br />
                <span className="text-xs text-gray-500">
                  {this.state.error?.message || '알 수 없는 오류'}
                </span>
              </p>
              <Button variant="outline" size="sm" onClick={this.handleRetry}>
                <RefreshCw size={16} className="mr-2" />
                다시 시도
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
