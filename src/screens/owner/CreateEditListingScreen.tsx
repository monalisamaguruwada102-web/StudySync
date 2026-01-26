import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Check, X, Image as ImageIcon, Building2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { storageService } from '../../services/storage.service';
import { listingsService } from '../../services/listings.service';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { Listing } from '../../types';
import * as FileSystem from 'expo-file-system/legacy';

export const CreateEditListingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const listingId = route.params?.listingId;
    const isEditing = !!listingId;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);

    const [currentStep, setCurrentStep] = useState(1);

    // Form State
    const [propertyName, setPropertyName] = useState('');
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'mixed'>('mixed');
    const [maxOccupancy, setMaxOccupancy] = useState('1');
    const [amenities, setAmenities] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [ownerPhone, setOwnerPhone] = useState('');
    const [ecocashNumber, setEcocashNumber] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchListing();
        } else {
            // New listing: Pre-populate with owner's phone if available
            loadOwnerProfile();
        }
    }, [listingId]);

    const loadOwnerProfile = async () => {
        const session = await authService.getCurrentSession();
        if (session?.profile?.phone_number) {
            setOwnerPhone(session.profile.phone_number);
        }
    };

    const fetchListing = async () => {
        try {
            const listing = await listingsService.getListingById(listingId);
            if (listing) {
                setPropertyName(listing.propertyName || '');
                setTitle(listing.title);
                setLocation(listing.location);
                setPrice(listing.price.toString());
                setDescription(listing.description);
                if (listing.gender) setGender(listing.gender);
                setMaxOccupancy(listing.maxOccupancy.toString());
                setAmenities(listing.amenities);
                if (listing.images && listing.images.length > 0) {
                    setSelectedImage(listing.images[0]);
                }
                if (listing.ownerPhone) setOwnerPhone(listing.ownerPhone);
                if (listing.ecocashNumber) setEcocashNumber(listing.ecocashNumber);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch listing details');
            navigation.goBack();
        } finally {
            setInitialLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const toggleAmenity = (amenity: string) => {
        if (amenities.includes(amenity)) {
            setAmenities(amenities.filter(a => a !== amenity));
        } else {
            setAmenities([...amenities, amenity]);
        }
    };

    const uploadImage = async (uri: string) => {
        if (!user?.id) throw new Error('User not authenticated');
        return await storageService.uploadListingImage(user.id, uri);
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!propertyName || !title) {
                Alert.alert('Required', 'Please enter property name and title.');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!location || !price) {
                Alert.alert('Required', 'Please enter location and price.');
                return;
            }
            const priceValue = parseFloat(price);
            if (isNaN(priceValue) || priceValue > 100) {
                Alert.alert('Price Constraint', 'Price must be $100 or less per session.');
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleSave = async () => {
        if (!ownerPhone || !ecocashNumber) {
            Alert.alert('Required', 'Please enter contact and EcoCash numbers.');
            return;
        }

        setLoading(true);
        try {
            let imageUrls = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'];

            if (selectedImage) {
                if (selectedImage.startsWith('http')) {
                    imageUrls = [selectedImage];
                } else {
                    try {
                        console.log('[CreateEditListing] Attempting image upload:', selectedImage);
                        const uploadedUrl = await uploadImage(selectedImage);
                        if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
                            throw new Error('Upload returned an invalid URL: ' + uploadedUrl);
                        }
                        console.log('[CreateEditListing] Image uploaded successfully:', uploadedUrl);
                        imageUrls = [uploadedUrl];
                    } catch (uploadError: any) {
                        console.error('[CreateEditListing] Image Upload Exception:', uploadError);
                        const errorDetails = uploadError.message || JSON.stringify(uploadError);
                        Alert.alert(
                            'Upload Failed',
                            `We couldn't upload your property image.\n\nError: ${errorDetails}\n\nPlease check your internet connection and try again.`
                        );
                        setLoading(false);
                        return;
                    }
                }
            }

            const listingData: Partial<Listing> = {
                id: listingId,
                propertyName,
                title,
                location,
                price: parseFloat(price),
                description,
                gender,
                maxOccupancy: parseInt(maxOccupancy),
                amenities,
                ownerId: user?.id || '',
                ownerName: user?.name || 'Property Owner',
                ownerPhone,
                ecocashNumber,
                distance: 'Nearby',
                images: imageUrls,
                isVerified: false, // New/Edited listings always go to pending
            };

            await listingsService.saveListing(listingData);

            // Invalidate queries to auto-refresh other screens
            await queryClient.invalidateQueries({ queryKey: ['listings'] });
            await queryClient.invalidateQueries({ queryKey: ['admin-pending-listings'] });
            await queryClient.invalidateQueries({ queryKey: ['owner-listings'] });

            Alert.alert(
                'Success',
                `Property ${isEditing ? 'updated' : 'listed'} successfully! It will be visible once verified by admin.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to save property. ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const ProgressHeader = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
                <View key={step} style={styles.stepIndicatorContainer}>
                    <View style={[
                        styles.stepBubble,
                        { backgroundColor: currentStep >= step ? colors.primary : colors.border }
                    ]}>
                        {currentStep > step ? (
                            <Check size={14} color="white" />
                        ) : (
                            <Text style={[styles.stepNumber, { color: currentStep >= step ? 'white' : colors.textLight }]}>{step}</Text>
                        )}
                    </View>
                    {step < 3 && (
                        <View style={[
                            styles.stepLine,
                            { backgroundColor: currentStep > step ? colors.primary : colors.border }
                        ]} />
                    )}
                </View>
            ))}
        </View>
    );

    if (initialLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textLight }}>Loading property details...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isEditing ? 'Edit Property' : 'List New Property'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ProgressHeader />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {currentStep === 1 && (
                        <View style={styles.formContainer}>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 1: The Basics</Text>
                            <Text style={[styles.stepSubTitle, { color: colors.textLight }]}>Tell us what your boarding home is called and give it a catchy title.</Text>

                            <View style={[styles.inputGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                                <CustomInput
                                    label="Boarding Home Name"
                                    placeholder="e.g. Sunrise Heights"
                                    value={propertyName}
                                    onChangeText={setPropertyName}
                                />
                                <View style={[styles.inlineDivider, { backgroundColor: colors.border }]} />
                                <CustomInput
                                    label="Listing Title"
                                    placeholder="e.g. Spacious Single Room with Solar"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={[styles.inputGroup, { backgroundColor: colors.surface, marginTop: 20 }, shadows.soft]}>
                                <CustomInput
                                    label="Property Description"
                                    placeholder="Describe the vibe, rules, and unique features..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={6}
                                    style={{ height: 160, textAlignVertical: 'top' }}
                                />
                            </View>
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View style={styles.formContainer}>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 2: Logistics & Amenities</Text>
                            <Text style={[styles.stepSubTitle, { color: colors.textLight }]}>Where is it located, how much does it cost, and what's included?</Text>

                            <View style={[styles.inputGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                                <CustomInput
                                    label="Location / Neighborhood"
                                    placeholder="e.g. Greendale, Harare"
                                    value={location}
                                    onChangeText={setLocation}
                                />
                                <View style={[styles.inlineDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <CustomInput
                                            label="Price ($/mo)"
                                            placeholder="e.g. 80"
                                            value={price}
                                            onChangeText={setPrice}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                                    <View style={{ flex: 1 }}>
                                        <CustomInput
                                            label="Max Students"
                                            placeholder="e.g. 2"
                                            value={maxOccupancy}
                                            onChangeText={setMaxOccupancy}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.label, { color: colors.text }]}>Tenant Preference</Text>
                            <View style={[styles.genderRow, { backgroundColor: colors.surface }, shadows.soft]}>
                                {['mixed', 'male', 'female'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.genderTab,
                                            gender === g && { backgroundColor: isDark ? colors.primary : colors.white }
                                        ]}
                                        onPress={() => setGender(g as any)}
                                    >
                                        <Text style={[
                                            styles.genderText,
                                            { color: colors.textLight },
                                            gender === g && { color: isDark ? colors.white : colors.primary }
                                        ]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { color: colors.text }]}>Amenities Included</Text>
                            <View style={styles.amenitiesGrid}>
                                {['Wifi', 'Water', 'Security', 'Solar', 'Laundry', 'Meals'].map((a) => (
                                    <TouchableOpacity
                                        key={a}
                                        style={[
                                            styles.amenityChip,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            amenities.includes(a) && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => toggleAmenity(a)}
                                    >
                                        {amenities.includes(a) && <Check size={14} color="#ffffff" style={{ marginRight: 6 }} />}
                                        <Text style={[
                                            styles.amenityText,
                                            { color: colors.text },
                                            amenities.includes(a) && { color: "#ffffff", fontWeight: '700' }
                                        ]}>
                                            {a}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {currentStep === 3 && (
                        <View style={styles.formContainer}>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 3: Media & Verification</Text>
                            <Text style={[styles.stepSubTitle, { color: colors.textLight }]}>A good photo and correct payment details are essential.</Text>

                            <TouchableOpacity
                                style={[styles.imagePicker, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
                                onPress={pickImage}
                            >
                                {selectedImage ? (
                                    <Image
                                        source={{ uri: selectedImage }}
                                        style={styles.previewImage}
                                        onError={(e) => {
                                            console.error('[CreateEditListing] Image preview load error:', e.nativeEvent.error);
                                            // Optional: Alert.alert('Preview Error', 'Failed to load image preview.');
                                        }}
                                    />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Camera size={38} color={colors.primary} />
                                        <Text style={[styles.imagePickerText, { color: colors.textLight }]}>Upload Cover Photo</Text>
                                    </View>
                                )}
                                {selectedImage && (
                                    <View style={styles.changeImageBox}>
                                        <ImageIcon size={16} color="#ffffff" />
                                        <Text style={styles.changeImageText}>Update Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={[styles.inputGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                                <CustomInput
                                    label="Contact Phone Number"
                                    placeholder="e.g. 0789932832"
                                    value={ownerPhone}
                                    onChangeText={setOwnerPhone}
                                    keyboardType="phone-pad"
                                />
                                <View style={[styles.inlineDivider, { backgroundColor: colors.border }]} />
                                <CustomInput
                                    label="EcoCash Number (Payments)"
                                    placeholder="e.g. 0771234567"
                                    value={ecocashNumber}
                                    onChangeText={setEcocashNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => {
                                        Alert.alert(
                                            'Delete Listing',
                                            'Are you sure? This cannot be undone.',
                                            [
                                                { text: 'Keep It', style: 'cancel' },
                                                {
                                                    text: 'Delete',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        await listingsService.deleteListing(listingId);
                                                        navigation.goBack();
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={[styles.deleteButtonText, { color: colors.error }]}>Permanently Remove Listing</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        {currentStep > 1 && (
                            <TouchableOpacity
                                style={[styles.backStepBtn, { borderColor: colors.primary }]}
                                onPress={() => setCurrentStep(currentStep - 1)}
                            >
                                <Text style={[styles.backStepText, { color: colors.primary }]}>Back</Text>
                            </TouchableOpacity>
                        )}

                        <View style={{ flex: 1 }}>
                            {currentStep < 3 ? (
                                <CustomButton
                                    title="Continue"
                                    onPress={handleNext}
                                />
                            ) : (
                                <CustomButton
                                    title={isEditing ? "Update Property" : "List My Property"}
                                    onPress={handleSave}
                                    loading={loading}
                                />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepBubble: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '800',
    },
    stepLine: {
        width: 40,
        height: 2,
        marginHorizontal: 4,
    },
    scrollContent: {
        padding: Spacing.l,
        paddingTop: 0,
    },
    formContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    stepSubTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 24,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    changeImageBox: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    changeImageText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        marginLeft: 4,
    },
    imagePickerText: {
        marginTop: 12,
        fontWeight: '700',
        fontSize: 15,
    },
    inputGroup: {
        borderRadius: 24,
        padding: 12,
    },
    inlineDivider: {
        height: 1,
        marginHorizontal: 12,
        opacity: 0.5,
    },
    verticalDivider: {
        width: 1,
        marginVertical: 12,
        opacity: 0.5,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: 24,
        marginBottom: 12,
        marginLeft: 4,
    },
    genderRow: {
        borderRadius: 20,
        padding: 6,
        flexDirection: 'row',
    },
    genderTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 14,
    },
    genderText: {
        fontSize: 14,
        fontWeight: '700',
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    amenityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 10,
        marginBottom: 12,
    },
    amenityText: {
        fontSize: 14,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 32,
        marginBottom: 48,
        alignItems: 'center',
    },
    backStepBtn: {
        height: 56,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 2,
        marginRight: 12,
    },
    backStepText: {
        fontWeight: '800',
        fontSize: 16,
    },
    deleteButton: {
        marginTop: 32,
        alignItems: 'center',
        padding: 12,
    },
    deleteButtonText: {
        fontWeight: '700',
        fontSize: 14,
    }
});

