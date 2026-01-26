
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Theme } from '../theme/Theme';

interface UserAvatarProps {
    uri?: string | null;
    name?: string;
    size?: number;
    color?: string; // Background color for initials
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, name, size = 40, color }) => {
    const fontSize = size * 0.4;
    const initials = name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

    if (uri && uri !== '' && !uri.includes('undefined')) {
        return (
            <Image
                source={{ uri }}
                style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f1f5f9' }}
            />
        );
    }

    return (
        <View
            style={[
                styles.avatarPlaceholder,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color || Theme.Light.Colors.primary,
                },
            ]}
        >
            <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: 'white',
        fontWeight: 'bold',
    },
});
