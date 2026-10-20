import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore ${parsed.operationType} failed: ${parsed.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-[#FBFBFA]">
          <Card className="w-full max-w-md border border-border shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="pt-8 px-8">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {errorMessage}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full h-10 text-[14px] font-medium bg-black text-white hover:bg-black/90"
              >
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
