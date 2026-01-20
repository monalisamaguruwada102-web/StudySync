import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    Alert,
    LayoutAnimation,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Mail, ChevronRight, Info, HelpCircle, FileText, ChevronDown, CheckCircle2, X, Bot } from 'lucide-react-native';
import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export const SupportScreen = () => {
    const navigation = useNavigation<any>();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);
    const [isGuidelinesVisible, setGuidelinesVisible] = React.useState(false);

    const faqs = [
        {
            q: "How do I secure a room?",
            a: "Find a listing you like, tap 'Secure Room', choose your payment method (EcoCash or Card), and complete the deposit. The owner will be notified immediately."
        },
        {
            q: "Is my payment safe?",
            a: "Yes! Payments are held in escrow and only released to the owner once you've successfully moved in or as per our refund policy."
        },
        {
            q: "How can I contact an owner?",
            a: "Every listing has a 'Chat' button. You can also see their phone number in the owner section of the listing details."
        },
        {
            q: "What if the room doesn't match the photos?",
            a: "We offer a 24-hour dispute window after check-in. If the property is significantly different from the listing, we will refund your deposit."
        }
    ];

    const toggleFaq = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const handleCall = () => {
        Linking.openURL('tel:0789932832').catch(() => {
            Alert.alert('Error', 'Unable to open dialer');
        });
    };

    const handleEmail = () => {
        Linking.openURL('mailto:joshuamujakari15@gmail.com').catch(() => {
            Alert.alert('Error', 'Unable to open email client');
        });
    };

    const SupportCard = ({ icon: Icon, title, description, onPress, color }: any) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.cardDescription, { color: colors.textLight }]}>{description}</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Support Center</Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>How can we help you today?</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
                    <SupportCard
                        icon={Bot}
                        title="Chat with Assistant"
                        description="Get instant answers from our bot"
                        color="#8b5cf6"
                        onPress={() => navigation.navigate('SupportBot')}
                    />
                    <SupportCard
                        icon={Phone}
                        title="Call Support"
                        description="Direct chat with our team: +263 78 993 2832"
                        color="#10b981"
                        onPress={handleCall}
                    />
                    <SupportCard
                        icon={Mail}
                        title="Email Support"
                        description="support@boarding.co.zw"
                        color="#3b82f6"
                        onPress={handleEmail}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Resources</Text>
                    <View style={[styles.resourcesGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                        <TouchableOpacity style={styles.resourceItem} onPress={() => setGuidelinesVisible(true)}>
                            <HelpCircle size={20} color={colors.primary} />
                            <Text style={[styles.resourceLabel, { color: colors.text }]}>App Guidelines</Text>
                            <ChevronRight size={18} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
                    {faqs.map((faq, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.faqItem, { backgroundColor: colors.surface }, shadows.soft]}
                            onPress={() => toggleFaq(index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                                <ChevronDown
                                    size={18}
                                    color={colors.textLight}
                                    style={{ transform: [{ rotate: expandedFaq === index ? '180deg' : '0deg' }] }}
                                />
                            </View>
                            {expandedFaq === index && (
                                <Text style={[styles.faqAnswer, { color: colors.textLight }]}>{faq.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
                    <Info size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.primary }]}>
                        Our support team is available Mon-Fri, 8 AM - 5 PM CAT.
                    </Text>
                </View>

                {/* Guidelines Modal */}
                <Modal
                    visible={isGuidelinesVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setGuidelinesVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>App Guidelines</Text>
                                <TouchableOpacity onPress={() => setGuidelinesVisible(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.guidelineSection}>
                                    <CheckCircle2 size={20} color={colors.primary} />
                                    <Text style={[styles.guidelineText, { color: colors.text }]}>Always use the in-app chat for records.</Text>
                                </View>
                                <View style={styles.guidelineSection}>
                                    <CheckCircle2 size={20} color={colors.primary} />
                                    <Text style={[styles.guidelineText, { color: colors.text }]}>Verify property documents before final payments.</Text>
                                </View>
                                <View style={styles.guidelineSection}>
                                    <CheckCircle2 size={20} color={colors.primary} />
                                    <Text style={[styles.guidelineText, { color: colors.text }]}>Be respectful to owners and other students.</Text>
                                </View>
                                <View style={styles.guidelineSection}>
                                    <CheckCircle2 size={20} color={colors.primary} />
                                    <Text style={[styles.guidelineText, { color: colors.text }]}>Report any suspicious listings immediately.</Text>
                                </View>
                                <View style={styles.guidelineSection}>
                                    <CheckCircle2 size={20} color={colors.primary} />
                                    <Text style={[styles.guidelineText, { color: colors.text }]}>Keep your profile information accurate.</Text>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.l },
    header: { marginBottom: Spacing.xl },
    title: { ...Typography.h1, fontSize: 32 },
    subtitle: { ...Typography.caption, fontSize: 16, marginTop: 4 },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { ...Typography.h3, marginBottom: Spacing.m },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        marginBottom: Spacing.m,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '700' },
    cardDescription: { fontSize: 14, marginTop: 2 },
    resourcesGroup: { borderRadius: 24, overflow: 'hidden' },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    resourceLabel: { flex: 1, fontSize: 16, fontWeight: '600', marginLeft: 16 },
    infoBox: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: Spacing.l,
    },
    infoText: { flex: 1, fontSize: 14, fontWeight: '600', marginLeft: 12 },
    faqItem: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        paddingRight: 10,
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 22,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    guidelineSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    guidelineText: {
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    }
});
