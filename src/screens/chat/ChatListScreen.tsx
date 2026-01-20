import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, MessageSquare, Plus } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chat.service';
import { useAuth } from '../../context/AuthContext';
import { Conversation } from '../../types';

export const ChatListScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchConversations();
        }, [user?.id])
    );

    const fetchConversations = async () => {
        const data = await chatService.getConversations(user?.id || '');
        setConversations(data.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)));
        setLoading(false);
    };

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        const now = new Date();
        const date = new Date(timestamp);

        if (now.toDateString() === date.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderItem = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={[styles.conversationItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('ChatRoom', { conversationId: item.id, title: item.otherParticipantName })}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{item.otherParticipantName.charAt(0)}</Text>
                </View>
                <View style={[styles.onlineBadge, { borderColor: colors.surface, backgroundColor: colors.secondary }]} />
            </View>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.otherParticipantName}</Text>
                    <Text style={[styles.time, { color: colors.textLight }]}>{formatTime(item.lastMessageTime)}</Text>
                </View>
                <Text style={[styles.lastMessage, { color: colors.textLight }]} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Inbox</Text>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }, shadows.soft]}>
                    <Search size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
                            <MessageSquare size={48} color={colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>Your conversations with house owners will appear here.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
    },
    title: {
        ...Typography.h1,
        fontSize: 28,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: Spacing.s,
    },
    conversationItem: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.l,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
    },
    content: {
        flex: 1,
        marginLeft: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
    },
    time: {
        fontSize: 12,
        fontWeight: '500',
    },
    lastMessage: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});
