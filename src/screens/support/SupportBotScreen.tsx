import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Send, Bot, User, Trash2 } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/notifications.service';

interface Message {
    id: string;
    text: string;
    type: 'bot' | 'user';
    timestamp: number;
}

const FAQ_RESPONSES: { [key: string]: string } = {
    'payment': "You can securely pay for your room using EcoCash or your Visa/Mastercard. All payments are encrypted.",
    'verification': "To get verified, go to 'My Listings' and tap 'Verify'. You'll need to upload property deeds and your ID.",
    'refund': "Refund policies are set by individual property owners. Please read the 'Terms & Conditions' on the listing page.",
    'contact': "You can reach our main support line at +263 77 123 4567 or email support@boarding.co.zw",
    'hi': "Hello! I'm your Boarding Assistant. How can I help you today? You can ask about payments, verification, or contact info.",
    'hello': "Hi there! Need help with something? I'm here to answer your questions about the platform.",
    'shona': "Anonzwa chiShona? Ndingakubatsirei nhasi?",
    'ndebele': "Siyakubingelela! Singakusiza ngani namhla?",
    'default': "I'm not sure if I understand. Try asking about 'payments', 'verification', or 'how to contact support'."
};

export const SupportBotScreen = () => {
    const navigation = useNavigation<any>();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm Boardie, your automated support assistant. How can I help you today?",
            type: 'bot',
            timestamp: Date.now()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            type: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        // Process bot response
        setIsTyping(true);
        const lowerInput = inputText.toLowerCase();

        setTimeout(() => {
            let responseText = FAQ_RESPONSES.default;

            for (const key in FAQ_RESPONSES) {
                if (lowerInput.includes(key)) {
                    responseText = FAQ_RESPONSES[key];
                    break;
                }
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                type: 'bot',
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);

            // Trigger notification if user is not looking at the app or as feedback
            notificationService.scheduleLocalNotification(
                'Boardie Replied',
                responseText.substring(0, 50) + (responseText.length > 50 ? '...' : '')
            );
        }, 1500);
    };

    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isTyping]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isBot = item.type === 'bot';
        return (
            <View style={[
                styles.messageWrapper,
                isBot ? styles.botWrapper : styles.userWrapper
            ]}>
                {isBot && (
                    <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                        <Bot size={16} color={colors.primary} />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    { backgroundColor: isBot ? colors.surface : colors.primary },
                    isBot ? shadows.soft : shadows.medium,
                    !isBot && { borderBottomRightRadius: 4 }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isBot ? colors.text : '#ffffff' }
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        { color: isBot ? colors.textLight : 'rgba(255,255,255,0.7)' }
                    ]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Boarding Assistant</Text>
                    <View style={styles.onlineStatus}>
                        <View style={styles.onlineDot} />
                        <Text style={[styles.onlineText, { color: colors.textLight }]}>Always Online</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.clearBtn} onPress={() => setMessages([messages[0]])}>
                    <Trash2 size={20} color={colors.textLight} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => isTyping ? (
                    <View style={styles.typingContainer}>
                        <Text style={[styles.typingText, { color: colors.textLight }]}>Boardie is typing...</Text>
                    </View>
                ) : null}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textLight}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: colors.primary }, !inputText.trim() && { opacity: 0.5 }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} color="#ffffff" />
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
        borderBottomColor: 'transparent',
    },
    backBtn: {
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        ...Typography.h3,
        fontWeight: '800',
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    onlineText: {
        fontSize: 12,
        fontWeight: '500',
    },
    clearBtn: {
        padding: 8,
    },
    messageList: {
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.l,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        maxWidth: '85%',
    },
    botWrapper: {
        alignSelf: 'flex-start',
    },
    userWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    messageBubble: {
        padding: 14,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
        fontWeight: '600',
    },
    typingContainer: {
        marginBottom: 20,
    },
    typingText: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: 15,
        fontWeight: '500',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    }
});
