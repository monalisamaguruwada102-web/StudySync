import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';

interface CustomInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const CustomInput: React.FC<CustomInputProps> = ({
    label,
    error,
    containerStyle,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.textLight}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: Spacing.s,
        width: '100%',
    },
    label: {
        ...Typography.caption,
        marginBottom: Spacing.xs,
        fontWeight: '600',
        color: Colors.text,
    },
    inputContainer: {
        height: 56,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: Spacing.m,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    inputError: {
        borderColor: Colors.error,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
        marginTop: Spacing.xs,
    },
});
