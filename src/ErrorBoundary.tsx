import React, { Component, ErrorInfo } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060912', padding: 20 }}>
          <ScrollView>
            <Text style={{ color: '#EF4444', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
              Fatal JS Crash Detected
            </Text>
            <Text style={{ color: 'white', marginBottom: 10 }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
