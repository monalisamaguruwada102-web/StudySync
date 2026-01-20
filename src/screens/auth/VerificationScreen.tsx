import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ShieldCheck, Camera, FileText, CheckCircle2, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

export const VerificationScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [status, setStatus] = useState(user?.verificationStatus || 'none');

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your photos to verify your ID.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) {
            Alert.alert('Incomplete', 'Please upload a clear photo of your ID.');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload to Supabase Storage
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            const fileName = `${user?.id}/id_verification.jpg`;

            const { data, error: uploadError } = await supabase.storage
                .from('verifications')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (uploadError) throw uploadError;

            // 2. Update Profile to 'pending'
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    verification_status: 'pending',
                    id_document_url: fileName
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            setStatus('pending');
            Alert.alert('Application Sent', 'Your verification request is being reviewed by our team.');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit verification request.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'verified') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerContent}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                        <ShieldCheck size={64} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>You are Verified!</Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>
                        Your account has been fully verified. You now have the ShieldCheck badge on your profile.
                    </Text>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Great!</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (status === 'pending') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerContent}>
                    <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                        <AlertCircle size={64} color="#d97706" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Verification Pending</Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>
                        We are currently reviewing your documents. This usually takes 24-48 hours.
                    </Text>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Check Back Later</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHeaderBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Verification</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <ShieldCheck size={40} color={colors.primary} />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>Secure the Community</Text>
                    <Text style={[styles.infoText, { color: colors.textLight }]}>
                        Verified users build more trust. Owners with verified badges get **3x more inquiries** on average.
                    </Text>
                </View>

                <View style={styles.steps}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>How it works</Text>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Upload a photo of your National ID or Student ID.</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>Our team verifies the document against your profile.</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.uploadBox, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
                    onPress={pickImage}
                >
                    {selectedImage ? (
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Camera size={40} color={colors.textLight} />
                            <Text style={[styles.uploadText, { color: colors.textLight }]}>Tap to Upload ID Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.notice}>
                    <FileText size={16} color={colors.textLight} />
                    <Text style={[styles.noticeText, { color: colors.textLight }]}>
                        Your data is encrypted and handled according to our Privacy Policy.
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Verification</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
    },
    backHeaderBtn: {
        padding: 4,
    },
    headerTitle: {
        ...Typography.h3,
        fontWeight: '800',
    },
    scrollContent: {
        padding: Spacing.l,
    },
    infoBox: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    infoText: {
        textAlign: 'center',
        lineHeight: 22,
        fontSize: 15,
    },
    steps: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    uploadBox: {
        height: 220,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 12,
        fontWeight: '600',
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    noticeText: {
        fontSize: 12,
        marginLeft: 8,
        textAlign: 'center',
    },
    footer: {
        padding: Spacing.l,
        borderTopWidth: 1,
    },
    submitBtn: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 12,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 40,
    },
    backBtn: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
