import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>⚠️</Text>
                        </View>
                        <Text style={styles.title}>Oops! Something went wrong.</Text>
                        <Text style={styles.message}>
                            An unexpected error occurred. Don't worry, your data is safe.
                        </Text>

                        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                            <Text style={styles.buttonText}>🔄 Try Again</Text>
                        </TouchableOpacity>

                        {/* Debug Info */}
                        <View style={styles.debugContainer}>
                            <Text style={styles.debugTitle}>Error Details (for debugging):</Text>
                            <View style={styles.errorBox}>
                                <Text style={styles.errorName}>
                                    {this.state.error?.name || 'Unknown Error'}
                                </Text>
                                <Text style={styles.errorMessage}>
                                    {this.state.error?.message || 'No error message'}
                                </Text>
                                {this.state.error?.stack && (
                                    <Text style={styles.errorStack}>
                                        {this.state.error.stack.substring(0, 500)}...
                                    </Text>
                                )}
                            </View>
                            {this.state.errorInfo && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.debugSubtitle}>Component Stack:</Text>
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack?.substring(0, 500)}...
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.tip}>
                            💡 Tip: Take a screenshot of this error and share it with support
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    icon: {
        fontSize: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 32,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    debugContainer: {
        marginTop: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 12,
    },
    debugSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
    },
    errorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#dc2626',
        marginBottom: 4,
    },
    errorMessage: {
        fontSize: 13,
        color: '#991b1b',
        marginBottom: 8,
    },
    errorStack: {
        fontSize: 11,
        color: '#78350f',
        fontFamily: 'monospace',
    },
    tip: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 16,
    },
});
