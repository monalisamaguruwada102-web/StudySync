import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    Share,
    Alert,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
    Clipboard,
} from 'react-native';
import { Image } from 'expo-image';
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

import { Spacing } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics.service';
import { bookmarksService } from '../../services/bookmarks.service';
import { listingsService } from '../../services/listings.service';
import { bookingsService } from '../../services/bookings.service';
import { chatService } from '../../services/chat.service';
import { notificationService } from '../../services/notifications.service';

const { width } = Dimensions.get('window');

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800';
const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';

export const ListingDetailsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const [listing, setListing] = useState(route.params.listing);
    const { t } = useTranslation();
    const { colors, shadows, isDark } = useTheme();
    const { user } = useAuth();

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
    const [chatLoading, setChatLoading] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);

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
            loadReviews();
        }
    }, [listing.id, user?.id]);

    const loadReviews = async () => {
        try {
            const data = await listingsService.getReviews(listing.id);
            setReviews(data);
        } catch (error) {
            console.error('[ListingDetails] Error loading reviews:', error);
        }
    };

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
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to chat with owners.');
            return;
        }

        setChatLoading(true);
        try {
            const conversation = await chatService.getOrCreateConversation(
                user.id,
                user.name || 'Student',
                listing.ownerId,
                listing.ownerName || 'Property Owner'
            );
            navigation.navigate('ChatRoom', {
                conversationId: conversation.id,
                title: listing.ownerName || 'Property Owner'
            });
        } catch (error: any) {
            console.error('[ListingDetails] Chat Error:', error);
            const errorMessage = error.message || error.details || error.hint || 'Unknown error';
            Alert.alert(
                'Chat Error',
                `Unable to start chat. \n\nError: ${errorMessage}\n\nPlease try again later.`
            );
        } finally {
            setChatLoading(false);
        }
    };

    const handleWhatsAppChat = () => {
        const rawPhone = listing.ownerPhone || '0771234567';
        // Sanitize phone number: remove spaces and non-digits
        const phone = rawPhone.replace(/\D/g, '');
        // Ensure Zimbabwe country code if missing (optional, but good for local context)
        const formattedPhone = phone.startsWith('0') ? '263' + phone.substring(1) : phone;

        const message = `Hi, I'm interested in your property: ${listing.propertyName || listing.title}. Is it still available?`;
        const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                return Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
            }
        }).catch(() => {
            Alert.alert('Error', 'Unable to open WhatsApp');
        });
    };

    const handleCallOwner = () => {
        const rawPhone = listing.ownerPhone || '0771234567';
        const phone = rawPhone.replace(/\D/g, '');
        const url = `tel:${phone}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (!supported) {
                    Alert.alert(
                        'Device Limit',
                        `Calling is not supported on this device. Would you like to copy the number? \n\n${rawPhone}`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Copy Number',
                                onPress: () => {
                                    Clipboard.setString(rawPhone);
                                    Alert.alert('Success', 'Phone number copied to clipboard');
                                }
                            }
                        ]
                    );
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

    const handleShareWithParent = () => {
        const securitySummary = listing.isVerified ? "✅ Verified Property" : "Verified status pending";
        const safetyFeatures = listing.amenities?.filter((a: string) =>
            ['Security', 'CCTV', 'Fenced', 'Gated', 'Safe'].some(s => a.includes(s))
        ).join(', ') || 'Standard security';

        const message = `Hi! I found this boarding house on Off Rez Connect:\n\n` +
            `🏠 *${listing.propertyName || listing.title}*\n` +
            `📍 Location: ${listing.location}\n` +
            `💰 Price: $${listing.price}/mo\n` +
            `🛡️ Safety: ${securitySummary}\n` +
            `🔒 Features: ${safetyFeatures}\n\n` +
            `What do you think?`;

        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                // Fallback to web link
                return Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
            }
        }).catch(() => {
            Alert.alert('Error', 'Unable to open WhatsApp');
        });
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
                userId: user?.id,
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
        } catch (error: any) {
            console.error('[ListingDetails] Review Error:', error);
            const errorMessage = error.message || error.details || error.hint || 'Unknown error';
            Alert.alert(
                'Review Failed',
                `We couldn't submit your review. \n\nError: ${errorMessage}\n\nPlease check your internet connection and try again.`
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCreateBooking = async () => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in or create an account to book your stay.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign In', onPress: () => navigation.navigate('Login') }
                ]
            );
            setBookingModalVisible(false);
            return;
        }

        setBookingLoading(true);
        try {
            const booking = await bookingsService.createBooking({
                listingId: listing.id,
                studentId: user.id,
                ownerId: listing.ownerId,
                totalPrice: listing.price,
                listingTitle: listing.propertyName || listing.title,
                studentName: user.name || 'Anonymous Student',
                studentPhone: user.phone || '',
                ownerPhone: listing.ownerPhone || '',
            });

            if (booking.id.startsWith('queued_')) {
                Alert.alert(
                    'Offline: Booking Queued',
                    'You are currently offline. Your booking request has been queued and will be sent automatically once you are back online.',
                    [{ text: 'OK', onPress: () => navigation.navigate('MyBookings') }]
                );
                return;
            }

            await notificationService.scheduleLocalNotification(
                'Request Sent',
                `Your booking request for ${listing.propertyName || 'the property'} has been sent to the owner.`
            );

            setBookingModalVisible(false);

            // WhatsApp Manual Payment Flow
            const rawPhone = listing.ownerPhone || '0771234567';
            const phone = rawPhone.replace(/\D/g, '');
            const formattedPhone = phone.startsWith('0') ? '263' + phone.substring(1) : phone;

            const paymentInstructions = (listing.ecocashNumber)
                ? `\n\n💳 *Payment Details:*\nEcocash: ${listing.ecocashNumber}\nAccount: ${listing.ownerName || 'Property Owner'}`
                : '';

            const message = `Hi! I just sent a booking request via Off Rez Connect.\n\n` +
                `🏠 *Property:* ${listing.propertyName || listing.title}\n` +
                `💰 *Price:* $${listing.price}\n` +
                `🔖 *Reference:* ${booking.id.substring(0, 8).toUpperCase()}` +
                paymentInstructions +
                `\n\nI'm ready to complete the payment. Please let me know the next steps.`;

            const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

            Alert.alert(
                'Booking Request Sent!',
                'Your request has been recorded. To secure your room faster, we will now open WhatsApp so you can send the payment confirmation to the owner.',
                [
                    {
                        text: 'Continue to WhatsApp',
                        onPress: () => {
                            Linking.canOpenURL(whatsappUrl).then(supported => {
                                if (supported) {
                                    Linking.openURL(whatsappUrl).catch(() => {
                                        Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`).catch(() => {
                                            Alert.alert('Error', 'Unable to open WhatsApp or Browser.');
                                        });
                                    });
                                } else {
                                    Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`).catch(() => {
                                        Alert.alert('Error', 'Unable to open browser.');
                                    });
                                }
                                navigation.navigate('MyBookings');
                            }).catch(() => {
                                Alert.alert('Error', 'Something went wrong while trying to open WhatsApp.');
                                navigation.navigate('MyBookings');
                            });
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('[ListingDetails] Booking Error:', error);
            const errorMessage = error.message || error.details || error.hint || 'Unknown error';
            Alert.alert(
                'Booking Failed',
                `We couldn't send your request. \n\nError: ${errorMessage}\n\nPlease check your internet connection or try again later.`
            );
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
                        source={{ uri: listing.images[0] || PLACEHOLDER_IMAGE }}
                        style={styles.image}
                        contentFit="cover"
                        cachePolicy="disk"
                        transition={500}
                        placeholder={require('../../../assets/icon_fixed.png')}
                        onError={(e) => console.log(`ListingDetails main image error (${listing.id}):`, e)}
                    />

                    <SafeAreaView style={styles.headerOverlay}>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6' }]} onPress={() => navigation.goBack()}>
                                <ArrowLeft size={24} color={colors.text} />
                            </TouchableOpacity>
                            <View style={styles.headerRight}>
                                <TouchableOpacity
                                    style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6' }]}
                                    onPress={handleShareWithParent}
                                    activeOpacity={0.7}
                                >
                                    <Shield size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.roundBtn, { backgroundColor: colors.surface + 'E6', marginLeft: 12 }]} onPress={handleShare}>
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
                        <View style={styles.listingPriceContainer}>
                            <Text style={[styles.priceText, { color: colors.primary }]}>${listing.price}</Text>
                            <Text style={[styles.priceUnit, { color: colors.textLight }]}>per semester</Text>
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
                                    ({reviews.length})
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

                        {reviews && reviews.length > 0 ? (
                            reviews.map((review: any) => (
                                <View key={review.id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={[styles.reviewerName, { color: colors.text }]}>{review.user_name || review.userName}</Text>
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
                                source={{ uri: listing.ownerAvatar && listing.ownerAvatar.startsWith('http') ? listing.ownerAvatar : AVATAR_PLACEHOLDER }}
                                style={styles.ownerAvatar}
                                contentFit="cover"
                                cachePolicy="disk"
                                placeholder={require('../../../assets/icon_fixed.png')}
                                onError={(e) => console.log(`ListingDetails owner avatar error (${listing.id}):`, e)}
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
                <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: colors.primary, marginLeft: 10 }, shadows.strong, chatLoading && { opacity: 0.8 }]}
                    onPress={handleChatWithOwner}
                    disabled={chatLoading}
                >
                    {chatLoading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <>
                            <MessageCircle size={20} color={colors.white} />
                            <Text style={styles.chatBtnText}>Chat</Text>
                        </>
                    )}
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
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={styles.confirmHeader}>
                                <View style={[styles.confirmIconBox, { backgroundColor: colors.primary + '20' }]}>
                                    <ShieldCheck size={32} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.confirmTitle, { color: colors.text }]}>Secure Your Stay</Text>
                                    <Text style={[styles.confirmSub, { color: colors.textLight }]}>
                                        Requesting to book: {listing.propertyName || listing.title}
                                    </Text>
                                </View>
                            </View>

                            {/* Manual Payment Instructions */}
                            <View style={[styles.paymentInstructionCard, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                <Text style={[styles.paymentInstructionTitle, { color: colors.text }]}>Manual Payment Instructions</Text>

                                <View style={styles.instructionDetailRow}>
                                    <Text style={[styles.instDetailLabel, { color: colors.textLight }]}>EcoCash Number</Text>
                                    <Text style={[styles.instDetailVal, { color: colors.primary }]}>{listing.ecocashNumber || '0789 932 832'}</Text>
                                </View>
                                <View style={styles.instructionDetailRow}>
                                    <Text style={[styles.instDetailLabel, { color: colors.textLight }]}>Account Name</Text>
                                    <Text style={[styles.instDetailVal, { color: colors.text }]}>{listing.ownerName || 'Property Owner'}</Text>
                                </View>
                                <View style={styles.instructionDetailRow}>
                                    <Text style={[styles.instDetailLabel, { color: colors.textLight }]}>Amount to Pay</Text>
                                    <Text style={[styles.instDetailVal, { color: colors.text, fontWeight: '800' }]}>${listing.price}</Text>
                                </View>

                                <View style={[styles.instructionNote, { backgroundColor: colors.primary + '10' }]}>
                                    <Text style={[styles.instructionNoteText, { color: colors.textLight }]}>
                                        1. Pay ${listing.price} to the EcoCash number above.{"\n"}
                                        2. Click "Confirm & Pay" below to send request.{"\n"}
                                        3. Send proof via WhatsApp for instant approval.
                                    </Text>
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
                                    <Text style={styles.confirmBtnText}>{bookingLoading ? 'Processing...' : 'Confirm & Pay'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
    checkIcon: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6
    },
    submitBar: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    totalLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    confirmModalContent: {
        padding: 24,
        borderRadius: 16,
        width: '90%',
        maxWidth: 400,
    },
    confirmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    confirmSub: {
        fontSize: 14,
        opacity: 0.7,
    },
    confirmDetailBox: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    confirmDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    confirmDetailLabel: {
        fontSize: 14,
        opacity: 0.7,
    },
    confirmDetailVal: {
        fontSize: 16,
        fontWeight: '600',
    },
    miniDivider: {
        height: 1,
        marginVertical: 12,
        opacity: 0.1,
        backgroundColor: '#000',
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
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
    listingPriceContainer: {
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
        flex: 1.2,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    payBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 6,
    },
    chatBtn: {
        flex: 0.9,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '800',
        marginLeft: 4,
    },
    paymentInstructionCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    paymentInstructionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
    },
    instructionDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    instDetailLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    instDetailVal: {
        fontSize: 14,
        fontWeight: '700',
    },
    instructionNote: {
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    instructionNoteText: {
        fontSize: 11,
        lineHeight: 16,
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
    confirmBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
