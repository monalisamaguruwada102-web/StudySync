import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Send, Phone, Video, Info, User, Plus } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chat.service';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { notificationService } from '../../services/notifications.service';

export const ChatRoomScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const { conversationId, title = 'Chat' } = route.params || {};
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadMessages();

        // Subscribe to real-time updates
        const subscription = chatService.subscribeToMessages(conversationId, (newMessage) => {
            setMessages(prev => {
                // Prevent duplicates if the message was already added by handleSend
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId]);

    const loadMessages = async () => {
        try {
            const data = await chatService.getMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        const tempId = `temp_${Date.now()}`;
        setInputText('');

        // 1. Optimistic Update (Immediate Feedback)
        const optimisticMessage: Message = {
            id: tempId,
            conversationId,
            senderId: user?.id || 'temp',
            text: text,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const newMessage = await chatService.sendMessage(
                conversationId,
                user?.id || 'temp',
                text,
                title
            );

            // 2. Resolve temporary message with persistent server-side message
            setMessages(prev => prev.map(m => m.id === tempId ? newMessage : m));

            // Simulation Mode Auto-Reply
            const { IS_SUPABASE_CONFIGURED } = await import('../../services/supabase');
            if (!IS_SUPABASE_CONFIGURED) {
                setTimeout(async () => {
                    const replyText = "Thanks for your message! I'll get back to you shortly.";
                    const replyMessage = await chatService.sendMessage(
                        conversationId,
                        'simulated_owner',
                        replyText,
                        title
                    );
                    setMessages(prev => [...prev, replyMessage]);

                    notificationService.scheduleLocalNotification(
                        `New message from ${title}`,
                        replyText
                    );
                }, 1500); // Faster simulation reply too
            }

        } catch (error) {
            console.error('[ChatRoom] Send Error:', error);
            // Optionally remove optimistic message or show error state
            setMessages(prev => prev.filter(m => m.id !== tempId));
            Alert.alert('Error', 'Failed to send message. Please try again.');
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.senderId === user?.id;

        return (
            <View style={[
                styles.messageRow,
                isMine ? styles.myMessageRow : styles.theirMessageRow
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMine
                        ? [styles.myBubble, { backgroundColor: colors.primary }]
                        : [styles.theirBubble, { backgroundColor: colors.surface }, shadows.soft]
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isMine ? colors.white : colors.text }
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        { color: isMine ? colors.white + '99' : colors.textLight }
                    ]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>{title.charAt(0)}</Text>
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                        <Text style={[styles.headerStatus, { color: colors.secondary }]}>Online</Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />
                )}

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Plus size={24} color={colors.textLight} />
                    </TouchableOpacity>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textLight}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.m,
        paddingBottom: 20,
    },
    messageRow: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    myMessageRow: {
        alignSelf: 'flex-end',
    },
    theirMessageRow: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        position: 'relative',
    },
    myBubble: {
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '500',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderTopWidth: 1,
    },
    attachBtn: {
        padding: 8,
        marginRight: 4,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
    },
    input: {
        fontSize: 15,
        paddingTop: Platform.OS === 'ios' ? 8 : 4,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
