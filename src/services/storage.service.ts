import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export type StorageBucket = 'listing-images' | 'user-assets' | 'verifications' | 'utility-bills';

export const storageService = {
    /**
     * Uploads an image to a specified Supabase bucket
     * @param uri Local file URI from image picker
     * @param bucket Destination bucket name
     * @param path Custom path within the bucket (e.g. "userId/timestamp.jpg")
     * @returns Public URL of the uploaded image
     */
    async uploadImage(uri: string, bucket: StorageBucket, path: string): Promise<string> {
        if (!IS_SUPABASE_CONFIGURED) {
            console.warn('Supabase not configured. Using local URI as fallback.');
            return uri;
        }

        if (uri.startsWith('http')) {
            return uri; // Already a remote URL
        }

        try {
            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

            // Upload to Supabase
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.error(`[StorageService] Supabase Upload Error (Bucket: ${bucket}, Path: ${path}):`, error.message);
                console.error(`[StorageService] Full Error Object:`, JSON.stringify(error, null, 2));
                throw new Error(`Upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            if (!publicUrl) {
                throw new Error('Failed to generate public URL for uploaded image.');
            }

            console.log(`[StorageService] Generated Public URL (${bucket}):`, publicUrl);
            return publicUrl;
        } catch (error: any) {
            console.error('Storage Service Upload Exception:', error);
            throw error; // Re-throw to be handled by UI
        }
    },

    /**
     * Helper for uploading listing images
     */
    async uploadListingImage(userId: string, uri: string): Promise<string> {
        const fileName = `${userId}/${Date.now()}.jpg`;
        return this.uploadImage(uri, 'listing-images', fileName);
    },

    /**
     * Helper for uploading user avatars
     */
    async uploadAvatar(userId: string, uri: string): Promise<string> {
        const fileName = `avatars/${userId}/${Date.now()}.jpg`;
        return this.uploadImage(uri, 'user-assets', fileName);
    },

    /**
     * Helper for uploading verification documents (private)
     */
    async uploadVerificationDoc(userId: string, uri: string): Promise<string> {
        const fileName = `${userId}/id_verification_${Date.now()}.jpg`;
        // Note: verifications bucket is private, so we don't get a public URL
        // Instead we return the path which is stored in profiles.id_document_url

        if (!IS_SUPABASE_CONFIGURED) {
            return uri;
        }

        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const { error } = await supabase.storage
                .from('verifications')
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;
            return fileName;
        } catch (error) {
            console.error('Verification Upload Error:', error);
            throw error;
        }
    },

    /**
     * Helper for uploading property verification docs
     */
    async uploadPropertyProof(listingId: string, uri: string): Promise<string> {
        const fileName = `property_${listingId}/proof_${Date.now()}.jpg`;

        if (!IS_SUPABASE_CONFIGURED) {
            return uri;
        }

        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const { error } = await supabase.storage
                .from('verifications')
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;
            return fileName;
        } catch (error) {
            console.error('[StorageService] Property Proof Upload Error:', error);
            throw error;
        }
    }
};
