# Smart Bookmark App

A simple bookmark manager built with Next.js, Supabase, and Tailwind CSS. Features Google OAuth authentication and real-time bookmark synchronization across multiple tabs.

## Features

- ✅ Google OAuth authentication (no email/password)
- ✅ Add bookmarks with URL and optional title
- ✅ Private bookmarks (users can only see their own)
- ✅ Real-time updates (changes appear instantly across all tabs)
- ✅ Delete bookmarks
- ✅ Modern, responsive UI with Tailwind CSS

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Authentication, Database, Realtime)
- **Tailwind CSS** (Styling)
- **TypeScript** (Type safety)

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Google OAuth credentials configured in Supabase

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Task
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   - Copy the contents of `supabase/migrations/001_create_bookmarks_table.sql`
   - Paste and execute it in the Supabase SQL Editor

3. Configure Google OAuth:
   - Go to **Authentication** > **Providers** in your Supabase dashboard
   - Enable **Google** provider
   - Add your Google OAuth credentials (Client ID and Client Secret)
   - Add your redirect URL: `https://your-project-url.vercel.app/auth/callback` (for production) and `http://localhost:3000/auth/callback` (for local development)

4. Enable Realtime:
   - Go to **Database** > **Replication** in your Supabase dashboard
   - Ensure the `bookmarks` table is enabled for replication

### 4. Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your Supabase credentials:
   - Get your project URL and anon key from **Settings** > **API** in your Supabase dashboard
   - Add them to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
.
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── AddBookmarkForm.tsx       # Form to add new bookmarks
│   ├── AuthButton.tsx            # Sign in/out button
│   └── BookmarkList.tsx          # List of bookmarks with real-time updates
├── utils/
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server Supabase client
│       └── middleware.ts         # Middleware helper
├── supabase/
│   └── migrations/
│       └── 001_create_bookmarks_table.sql  # Database schema
├── middleware.ts                 # Next.js middleware
└── README.md
```

## Problems Encountered and Solutions

### 1. **Supabase Realtime Not Working Initially**

**Problem:** Real-time updates weren't appearing across tabs even though the subscription was set up correctly.

**Solution:** 
- Verified that Realtime was enabled for the `bookmarks` table in Supabase dashboard (Database > Replication)
- Ensured the `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;` command was executed in the migration
- Added proper cleanup in the `useEffect` hook to unsubscribe when component unmounts

### 2. **Row Level Security (RLS) Policies**

**Problem:** Initially, users could see all bookmarks or couldn't access their own bookmarks.

**Solution:**
- Created comprehensive RLS policies for SELECT, INSERT, UPDATE, and DELETE operations
- All policies use `auth.uid() = user_id` to ensure users can only access their own data
- Tested policies thoroughly to ensure proper isolation between users

### 3. **OAuth Callback Route**

**Problem:** After Google OAuth sign-in, users were redirected but not properly authenticated.

**Solution:**
- Created a dedicated callback route at `/auth/callback/route.ts`
- Used `exchangeCodeForSession` to properly handle the OAuth code exchange
- Ensured the redirect URL in Supabase matches the callback route

### 4. **TypeScript Type Errors with Supabase**

**Problem:** TypeScript was complaining about missing types for Supabase queries.

**Solution:**
- Used proper type assertions for bookmark objects
- Created a `Bookmark` interface to type the data structure
- Ensured all Supabase client calls are properly typed

### 5. **Real-time Subscription Cleanup**

**Problem:** Memory leaks and multiple subscriptions when navigating between pages.

**Solution:**
- Added proper cleanup function in `useEffect` that removes the channel subscription
- Used `supabase.removeChannel(channel)` to clean up subscriptions on component unmount

### 6. **URL Validation**

**Problem:** Users could submit invalid URLs, causing errors.

**Solution:**
- Added client-side URL validation using the `URL` constructor
- Displayed user-friendly error messages for invalid inputs
- Used HTML5 `type="url"` input for additional browser validation

## Testing

To test the application:

1. **Authentication:**
   - Sign in with Google OAuth
   - Verify you can sign out

2. **Bookmark Management:**
   - Add a bookmark with URL and title
   - Verify it appears in the list
   - Delete a bookmark and verify it's removed

3. **Real-time Updates:**
   - Open the app in two browser tabs
   - Add a bookmark in one tab
   - Verify it appears automatically in the other tab
   - Delete a bookmark in one tab
   - Verify it disappears in the other tab

4. **Privacy:**
   - Sign in with two different Google accounts
   - Verify each user only sees their own bookmarks

## License

ISC

