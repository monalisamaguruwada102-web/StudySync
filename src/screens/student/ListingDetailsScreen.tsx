import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    Share,
    Alert,
    ScrollView,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import {
    Share as ShareIcon,
    ArrowLeft,
    Phone,
    Star,
    Lock,
    ShieldCheck,
    X,
    Heart,
    MapPin,
    Users,
    Waves,
    Shield,
    MessageCircle,
    Eye,
    Camera,
    Check,
    Flag,
    Share2,
} from 'lucide-react-native';

import { Theme, Spacing } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics.service';
import { bookmarksService } from '../../services/bookmarks.service';
import { listingsService } from '../../services/listings.service';
import { bookingsService } from '../../services/bookings.service';
import { notificationService } from '../../services/notifications.service';

const { width } = Dimensions.get('window');

export const ListingDetailsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const [listing, setListing] = useState(route.params.listing);
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [isSaved, setIsSaved] = useState(false);
    const [viewCount, setViewCount] = useState(0);
    const [isReviewModalVisible, setReviewModalVisible] = useState(false);
    const [rating, setRating] = useState(5);
    const [subRatings, setSubRatings] = useState({ cleanliness: 5, location: 5, value: 5 });
    const [comment, setComment] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    const SIMULATED_GALLERY = [
        'https://images.unsplash.com/photo-1522770179533-24471fcdba45',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
        'https://images.unsplash.com/photo-1560448204-61dc36dc98c8',
    ];

    useEffect(() => {
        if (listing.id) {
            analyticsService.trackView(listing.id, user?.id);
            checkBookmark();
            loadViewCount();
        }
    }, [listing.id, user?.id]);

    const loadViewCount = async () => {
        // Simulation: Get a "tracked" view count for this listing
        const count = Math.floor(Math.random() * 500) + 100; // Mock count
        setViewCount(count);
    };

    const checkBookmark = async () => {
        const bookmarked = await bookmarksService.isBookmarked(listing.id);
        setIsSaved(bookmarked);
    };

    const handleChatWithOwner = async () => {
        try {
            const { chatService } = await import('../../services/chat.service');
            const conversation = await chatService.getOrCreateConversation(
                user?.id || 'student_1',
                user?.name || 'Student',
                listing.ownerId,
                listing.ownerName || 'Property Owner'
            );
            navigation.navigate('ChatRoom', {
                conversationId: conversation.id,
                title: listing.ownerName || 'Property Owner'
            });
        } catch (error) {
            console.error('Failed to start conversation:', error);
        }
    };

    const handleWhatsAppChat = () => {
        const phone = listing.ownerPhone || '0771234567';
        const message = `Hi, I'm interested in your property: ${listing.propertyName || listing.title}. Is it still available?`;
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Try universal link if app scheme fails
                Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
            }
        });
    };

    const handleCallOwner = () => {
        const phoneNumber = listing.ownerPhone || '0771234567'; // Fallback to mock if not provided
        const url = `tel:${phoneNumber}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (!supported) {
                    Alert.alert('Error', 'Calling is not supported on this device');
                } else {
                    return Linking.openURL(url);
                }
            })
            .catch((err) => console.error('An error occurred', err));
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this boarding home: ${listing.propertyName || listing.title} in ${listing.location}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleReport = () => {
        Alert.alert(
            "Report Property",
            "Are you sure you want to report this property? Our team will review it for any policy violations.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Report",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Success", "Report submitted. Thank you for helping keep the community safe.");
                    }
                }
            ]
        );
    };

    const handleSubmitReview = async () => {
        if (!comment.trim()) {
            Alert.alert('Error', 'Please write a comment');
            return;
        }

        setSubmittingReview(true);
        try {
            await listingsService.submitReview(listing.id, {
                userName: user?.name || 'Anonymous Student',
                rating: rating,
                comment: comment.trim(),
                subRatings: subRatings,
                images: selectedImages,
            });
            Alert.alert('Success', 'Your review has been submitted!');
            setReviewModalVisible(false);
            setComment('');
            setRating(5);
            setSubRatings({ cleanliness: 5, location: 5, value: 5 });
            setSelectedImages([]);

            // Refetch listing to update UI
            const updated = await listingsService.getListingById(listing.id);
            if (updated) setListing(updated);
        } catch (error) {
            Alert.alert('Error', 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCreateBooking = async () => {
        setBookingLoading(true);
        try {
            await bookingsService.createBooking({
                listingId: listing.id,
                studentId: user?.id || 'temp_student',
                ownerId: listing.ownerId,
                totalPrice: listing.price,
                listingTitle: listing.propertyName || listing.title,
                studentName: user?.name || 'Anonymous Student',
            });

            await notificationService.scheduleLocalNotification(
                'Request Sent',
                `Your booking request for ${listing.propertyName || 'the property'} has been sent to the owner.`
            );

            setBookingModalVisible(false);
            Alert.alert(
                'Request Sent!',
                'The owner has been notified. You can track your request status in the Bookings tab.',
                [{ text: 'OK', onPress: () => navigation.navigate('MyBookings') }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to send booking request');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Image Header */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: listing.images[0] }}
                        style={styles.image}
                        fadeDuration={500}
                    />

                    <SafeAreaView style={styles.headerOverlay}>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6' }]} onPress={() => navigation.goBack()}>
                                <ArrowLeft size={24} color={colors.text} />
                            </TouchableOpacity>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6' }]} onPress={handleShare}>
                                    <Share2 size={20} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6', marginLeft: 12 }]} onPress={handleReport}>
                                    <Flag size={20} color={colors.textLight} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6', marginLeft: 12 }]}
                                    onPress={async () => {
                                        const newState = await bookmarksService.toggleBookmark(listing.id);
                                        setIsSaved(newState);
                                    }}
                                >
                                    <Heart size={20} color={isSaved ? colors.error : colors.text} fill={isSaved ? colors.error : 'transparent'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Content */}
                <View style={[styles.content, { backgroundColor: colors.surface }]}>
                    <View style={styles.mainInfo}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.propertyNameRow}>
                                <Text style={[styles.propertyName, { color: colors.text }]}>
                                    {listing.propertyName || 'Boarding Home'}
                                </Text>
                                {listing.isVerified && (
                                    <ShieldCheck size={20} color={colors.primary} style={{ marginLeft: 6 }} />
                                )}
                            </View>
                            <Text style={[styles.title, { color: colors.textLight }]}>{listing.title}</Text>
                            <View style={styles.locationContainer}>
                                <MapPin size={16} color={colors.primary} />
                                <Text style={[styles.locationText, { color: colors.text }]}>{listing.location}</Text>
                                <Text style={[styles.distanceText, { color: colors.textLight }]}> • {listing.distance}</Text>
                            </View>
                            <View style={[styles.viewBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Eye size={14} color={colors.primary} />
                                <Text style={[styles.viewText, { color: colors.primary }]}>{viewCount} Total Views</Text>
                            </View>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={[styles.priceText, { color: colors.primary }]}>${listing.price}</Text>
                            <Text style={[styles.priceUnit, { color: colors.textLight }]}>{t('listing.priceUnit')}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('listing.overview') || t('listing.amenities')}</Text>
                        <View style={styles.overviewGrid}>
                            <View style={[styles.overviewItem, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}>
                                <Users size={20} color={colors.primary} />
                                <Text style={[styles.overviewVal, { color: colors.text }]}>{listing.maxOccupancy} max</Text>
                                <Text style={[styles.overviewLabel, { color: colors.textLight }]}>Occupancy</Text>
                            </View>
                            <View style={[styles.overviewItem, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}>
                                <Waves size={20} color={colors.primary} />
                                <Text style={[styles.overviewVal, { color: colors.text }]}>{listing.gender}</Text>
                                <Text style={[styles.overviewLabel, { color: colors.textLight }]}>Gender</Text>
                            </View>
                            <View style={[styles.overviewItem, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}>
                                <Shield size={20} color={colors.primary} />
                                <Text style={[styles.overviewVal, { color: colors.text }]}>{listing.isVerified ? 'Yes' : 'No'}</Text>
                                <Text style={[styles.overviewLabel, { color: colors.textLight }]}>Verified</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('listing.description')}</Text>
                        <Text style={[styles.descriptionText, { color: colors.textLight }]}>
                            {listing.description || "This premium boarding home offers a comfortable stay with modern amenities. Perfect for students looking for a quiet and safe environment."}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('listing.amenities')}</Text>
                        <View style={styles.amenitiesList}>
                            {listing.amenities.map((amenity: string) => (
                                <View key={amenity} style={[styles.amenityTag, { backgroundColor: colors.primaryLight }]}>
                                    <Text style={[styles.amenityTagText, { color: colors.primary }]}>{amenity}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('listing.reviews')}</Text>
                            <View style={styles.ratingRow}>
                                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                <Text style={[styles.ratingText, { color: colors.text }]}>
                                    {listing.rating?.toFixed(1) || '0.0'}
                                </Text>
                                <Text style={[styles.reviewCount, { color: colors.textLight }]}>
                                    ({listing.reviews?.length || 0})
                                </Text>
                            </View>
                        </View>

                        {listing.subRatingStats && (
                            <View style={[styles.subRatingStats, { backgroundColor: colors.surface + '80' }]}>
                                <View style={styles.subRatingItem}>
                                    <Text style={[styles.subRatingLabel, { color: colors.textLight }]}>Cleanliness</Text>
                                    <View style={styles.subRatingBarContainer}>
                                        <View style={[styles.subRatingBar, { width: `${(listing.subRatingStats.cleanliness / 5) * 100}%`, backgroundColor: colors.primary }]} />
                                    </View>
                                    <Text style={[styles.subRatingVal, { color: colors.text }]}>{listing.subRatingStats.cleanliness.toFixed(1)}</Text>
                                </View>
                                <View style={styles.subRatingItem}>
                                    <Text style={[styles.subRatingLabel, { color: colors.textLight }]}>Location</Text>
                                    <View style={styles.subRatingBarContainer}>
                                        <View style={[styles.subRatingBar, { width: `${(listing.subRatingStats.location / 5) * 100}%`, backgroundColor: colors.primary }]} />
                                    </View>
                                    <Text style={[styles.subRatingVal, { color: colors.text }]}>{listing.subRatingStats.location.toFixed(1)}</Text>
                                </View>
                                <View style={styles.subRatingItem}>
                                    <Text style={[styles.subRatingLabel, { color: colors.textLight }]}>Value</Text>
                                    <View style={styles.subRatingBarContainer}>
                                        <View style={[styles.subRatingBar, { width: `${(listing.subRatingStats.value / 5) * 100}%`, backgroundColor: colors.primary }]} />
                                    </View>
                                    <Text style={[styles.subRatingVal, { color: colors.text }]}>{listing.subRatingStats.value.toFixed(1)}</Text>
                                </View>
                            </View>
                        )}

                        {listing.reviews && listing.reviews.length > 0 ? (
                            listing.reviews.map((review: any) => (
                                <View key={review.id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={[styles.reviewerName, { color: colors.text }]}>{review.userName}</Text>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    size={12}
                                                    color={s <= review.rating ? "#f59e0b" : colors.border}
                                                    fill={s <= review.rating ? "#f59e0b" : 'transparent'}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={[styles.reviewComment, { color: colors.textLight }]}>{review.comment}</Text>
                                    {review.images && review.images.length > 0 && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
                                            {review.images.map((img: string, idx: number) => (
                                                <Image
                                                    key={idx}
                                                    source={{ uri: img }}
                                                    style={styles.reviewThumbnail}
                                                    fadeDuration={300}
                                                />
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.noReviews, { color: colors.textLight }]}>No reviews yet. Be the first to review!</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.writeReviewBtn, { borderColor: colors.primary }]}
                            onPress={() => setReviewModalVisible(true)}
                        >
                            <Text style={[styles.writeReviewText, { color: colors.primary }]}>Write a Review</Text>
                        </TouchableOpacity>
                    </View>


                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Hosted by</Text>
                        <View style={[styles.ownerCard, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
                                style={styles.ownerAvatar}
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.ownerName, { color: colors.text }]}>{listing.ownerName}</Text>
                                <Text style={[styles.ownerRole, { color: colors.textLight }]}>Property Manager</Text>
                                <Text style={[styles.ownerPhoneText, { color: colors.primary }]}>{listing.ownerPhone || '0771 234 567'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity style={[styles.callIconBtn, { backgroundColor: colors.surface }]} onPress={handleCallOwner}>
                                    <Phone size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.callIconBtn, { backgroundColor: colors.surface, marginLeft: 10 }]}
                                    onPress={handleWhatsAppChat}
                                >
                                    <MessageCircle size={20} color={colors.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View >
            </ScrollView >

            <View style={[styles.bottomActions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: colors.secondary }, shadows.strong]}
                    onPress={() => setBookingModalVisible(true)}
                >
                    <Lock size={20} color={colors.white} />
                    <Text style={styles.payBtnText}>Secure Room</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 1 }, shadows.soft]}
                    onPress={handleWhatsAppChat}
                >
                    <MessageCircle size={20} color={colors.primary} />
                    <Text style={[styles.chatBtnText, { color: colors.primary }]}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chatBtn, { backgroundColor: colors.primary, marginLeft: 10 }, shadows.strong]} onPress={handleChatWithOwner}>
                    <MessageCircle size={20} color={colors.white} />
                    <Text style={styles.chatBtnText}>Chat</Text>
                </TouchableOpacity>
            </View>

            {/* Review Modal */}
            <Modal
                visible={isReviewModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Rate Property</Text>
                                <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.textLight, textAlign: 'center' }]}>Overall Rating</Text>
                            <View style={styles.starsSelection}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                        <Star
                                            size={40}
                                            color={s <= rating ? "#f59e0b" : colors.border}
                                            fill={s <= rating ? "#f59e0b" : 'transparent'}
                                            style={{ marginHorizontal: 4 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.subRatingsSection}>
                                <Text style={[styles.inputLabel, { color: colors.textLight, marginBottom: 12 }]}>Detailed Ratings</Text>

                                <View style={styles.subRatingRow}>
                                    <Text style={[styles.subRatingName, { color: colors.text }]}>Cleanliness</Text>
                                    <View style={styles.subStarsRow}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <TouchableOpacity key={s} onPress={() => setSubRatings({ ...subRatings, cleanliness: s })}>
                                                <Star size={24} color={s <= subRatings.cleanliness ? "#f59e0b" : colors.border} fill={s <= subRatings.cleanliness ? "#f59e0b" : 'transparent'} style={{ marginLeft: 6 }} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.subRatingRow}>
                                    <Text style={[styles.subRatingName, { color: colors.text }]}>Location</Text>
                                    <View style={styles.subStarsRow}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <TouchableOpacity key={s} onPress={() => setSubRatings({ ...subRatings, location: s })}>
                                                <Star size={24} color={s <= subRatings.location ? "#f59e0b" : colors.border} fill={s <= subRatings.location ? "#f59e0b" : 'transparent'} style={{ marginLeft: 6 }} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.subRatingRow}>
                                    <Text style={[styles.subRatingName, { color: colors.text }]}>Value for Money</Text>
                                    <View style={styles.subStarsRow}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <TouchableOpacity key={s} onPress={() => setSubRatings({ ...subRatings, value: s })}>
                                                <Star size={24} color={s <= subRatings.value ? "#f59e0b" : colors.border} fill={s <= subRatings.value ? "#f59e0b" : 'transparent'} style={{ marginLeft: 6 }} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 20 }]}>Add Photos (Simulation)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPicker}>
                                {SIMULATED_GALLERY.map((img, idx) => {
                                    const isSelected = selectedImages.includes(img);
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedImages(selectedImages.filter(i => i !== img));
                                                } else {
                                                    setSelectedImages([...selectedImages, img]);
                                                }
                                            }}
                                            style={styles.photoThumbContainer}
                                        >
                                            <Image source={{ uri: img }} style={[styles.photoThumb, isSelected && { borderColor: colors.primary, borderWidth: 2 }]} />
                                            {isSelected && (
                                                <View style={[styles.checkOverlay, { backgroundColor: colors.primary }]}>
                                                    <Check size={12} color="white" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 20 }]}>Your Experience</Text>
                            <TextInput
                                style={[styles.reviewInput, { backgroundColor: colors.surface, color: colors.text }]}
                                placeholder="How was your stay? Any tips for other students?"
                                placeholderTextColor={colors.textLight}
                                multiline
                                numberOfLines={4}
                                value={comment}
                                onChangeText={setComment}
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: colors.primary }, submittingReview && { opacity: 0.7 }]}
                                onPress={handleSubmitReview}
                                disabled={submittingReview}
                            >
                                <Text style={styles.submitBtnText}>{submittingReview ? 'Submitting...' : 'Submit Review'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Booking Confirmation Modal */}
            <Modal
                visible={isBookingModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setBookingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.confirmModalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.confirmHeader}>
                            <View style={[styles.confirmIconBox, { backgroundColor: colors.primary + '20' }]}>
                                <ShieldCheck size={32} color={colors.primary} />
                            </View>
                            <Text style={[styles.confirmTitle, { color: colors.text }]}>Secure Your Stay</Text>
                            <Text style={[styles.confirmSub, { color: colors.textLight }]}>
                                You are requesting to book a spot at {listing.propertyName || listing.title}.
                            </Text>
                        </View>

                        <View style={[styles.confirmDetailBox, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                            <View style={styles.confirmDetailRow}>
                                <Text style={[styles.confirmDetailLabel, { color: colors.textLight }]}>Price per session</Text>
                                <Text style={[styles.confirmDetailVal, { color: colors.text }]}>${listing.price}</Text>
                            </View>
                            <View style={[styles.miniDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.confirmDetailRow}>
                                <Text style={[styles.confirmDetailLabel, { color: colors.textLight }]}>Service Fee</Text>
                                <Text style={[styles.confirmDetailVal, { color: colors.success }]}>FREE</Text>
                            </View>
                            <View style={[styles.miniDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.confirmDetailRow}>
                                <Text style={[styles.confirmDetailLabel, { color: colors.text, fontWeight: '800' }]}>Total to Pay</Text>
                                <Text style={[styles.confirmDetailVal, { color: colors.primary, fontWeight: '900', fontSize: 20 }]}>${listing.price}</Text>
                            </View>
                        </View>

                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: colors.border }]}
                                onPress={() => setBookingModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textLight }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                                onPress={handleCreateBooking}
                                disabled={bookingLoading}
                            >
                                <Text style={styles.confirmBtnText}>{bookingLoading ? 'Sending...' : 'Confirm Request'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageContainer: {
        width: width,
        height: 380,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.l,
    },
    headerRight: {
        flexDirection: 'row',
    },
    roundBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        marginTop: -30,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: Spacing.l,
    },
    mainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    propertyName: {
        fontSize: 26,
        fontWeight: '800',
    },
    viewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    viewText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    locationText: {
        marginLeft: 4,
        fontWeight: '600',
    },
    distanceText: {
        fontSize: 14,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 28,
        fontWeight: '800',
    },
    priceUnit: {
        fontSize: 14,
        marginTop: -4,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.l,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 14,
        marginLeft: 4,
    },
    reviewItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    reviewerName: {
        fontWeight: '700',
        fontSize: 15,
    },
    starsRow: {
        flexDirection: 'row',
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
    },
    noReviews: {
        fontStyle: 'italic',
        fontSize: 14,
    },
    writeReviewBtn: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    writeReviewText: {
        fontWeight: '700',
    },
    overviewGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    overviewItem: {
        width: (width - 64) / 3,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
    },
    overviewVal: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 8,
    },
    overviewLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 26,
    },
    amenitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityTag: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginRight: 10,
        marginBottom: 10,
    },
    amenityTagText: {
        fontWeight: '700',
        fontSize: 14,
    },
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
    },
    ownerAvatar: {
        width: 54,
        height: 54,
        borderRadius: 18,
    },
    ownerName: {
        fontSize: 17,
        fontWeight: '700',
    },
    ownerRole: {
        fontSize: 13,
        marginTop: 2,
    },
    ownerPhoneText: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },
    callIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.l,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.l,
        flexDirection: 'row',
        borderTopWidth: 1,
    },
    payBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    payBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 8,
    },
    chatBtn: {
        flex: 0.5,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 8,
    },
    propertyNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '60%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    starsSelection: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
    },
    reviewInput: {
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        height: 120,
        textAlignVertical: 'top',
    },
    submitBtn: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    subRatingStats: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
    },
    subRatingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    subRatingLabel: {
        width: 80,
        fontSize: 13,
        fontWeight: '600',
    },
    subRatingBarContainer: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    subRatingBar: {
        height: '100%',
        borderRadius: 3,
    },
    subRatingVal: {
        width: 24,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'right',
    },
    reviewImages: {
        marginTop: 12,
    },
    reviewThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 10,
    },
    subRatingsSection: {
        marginTop: 24,
    },
    subRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    subRatingName: {
        fontSize: 14,
        fontWeight: '600',
    },
    subStarsRow: {
        flexDirection: 'row',
    },
    photoPicker: {
        marginTop: 12,
    },
    photoThumbContainer: {
        marginRight: 12,
        position: 'relative',
    },
    photoThumb: {
        width: 100,
        height: 100,
        borderRadius: 16,
    },
    checkOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
