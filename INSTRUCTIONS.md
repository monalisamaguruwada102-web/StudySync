
# CampusConnect Final Backend Setup Guide

This guide contains the final manual steps required to fully configure your Supabase backend. Following these instructions will enable file uploads (user avatars, post images/videos) and secure your storage.

There are two ways to complete this setup:

1.  **SQL Script (Recommended):** Run the `storage-setup.sql` file in your Supabase SQL Editor.
2.  **Manual UI Steps:** Follow the detailed steps below to create buckets and policies via the dashboard.

---

## Option 1: Run the SQL Script (Recommended)

1.  Open the `storage-setup.sql` file in your code editor.
2.  Copy its entire content.
3.  Navigate to your Supabase Project Dashboard.
4.  In the left-hand menu, click on the **SQL Editor** icon.
5.  Click **"+ New query"**.
6.  Paste the copied SQL content into the query window.
7.  Click **"Run"**.

Your storage is now fully configured.

---

## Option 2: Manual Setup via Dashboard

### Part 1: Create Storage Buckets

1.  Navigate to your Supabase Project Dashboard.
2.  In the left-hand menu, click on the **Storage** icon.
3.  Click **"Create bucket"**. Name it `avatars` and ensure **"Public bucket"** is CHECKED.
4.  Click **"Create bucket"** again. Name it `post_media` and ensure **"Public bucket"** is CHECKED.

### Part 2: Apply Security Policies

#### A. Policies for the "avatars" Bucket

1.  Click on the `avatars` bucket, then go to the **"Policies"** tab.
2.  Click **"New policy"** and select **"Create your own policy from scratch"**.
3.  Create the following three policies:
    *   **Policy #1: Allow users to UPLOAD their own avatar.**
        *   **Name:** `Users can upload their own avatar`
        *   **Operation:** `insert`
        *   **WITH CHECK expression:** `auth.uid() = owner`
    *   **Policy #2: Allow users to UPDATE their own avatar.**
        *   **Name:** `Users can update their own avatar`
        *   **Operation:** `update`
        *   **USING expression:** `auth.uid() = owner`
    *   **Policy #3: Allow users to DELETE their own avatar.**
        *   **Name:** `Users can delete their own avatar`
        *   **Operation:** `delete`
        *   **USING expression:** `auth.uid() = owner`

#### B. Policies for the "post_media" Bucket

1.  Click on the `post_media` bucket, then go to the **"Policies"** tab.
2.  Click **"New policy"** and select **"Create your own policy from scratch"**.
3.  Create the following two policies:
    *   **Policy #1: Allow logged-in users to UPLOAD media.**
        *   **Name:** `Authenticated users can upload post media`
        *   **Operation:** `insert`
        *   **WITH CHECK expression:** `auth.role() = 'authenticated'`
    *   **Policy #2: Allow users to DELETE their own media.**
        *   **Name:** `Users can delete their own post media`
        *   **Operation:** `delete`
        *   **USING expression:** `auth.uid() = owner`

---

## Setup Complete!

Your backend is now fully configured. The database schema is in place, and your storage is set up with the correct security policies. You can now refresh the application.
