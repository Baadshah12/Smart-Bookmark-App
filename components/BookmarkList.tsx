'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useMemo, useCallback } from 'react';

interface Bookmark {
  id: string;
  url: string;
  title: string;
  created_at: string;
  user_id: string;
}

interface BookmarkListProps {
  userId: string;
}

export default function BookmarkList({ userId }: BookmarkListProps) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
    } else {
      setBookmarks(data || []);
    }
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchBookmarks();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`bookmarks-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time event received:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => {
              // Check if bookmark already exists to avoid duplicates
              const exists = prev.some((b) => b.id === payload.new.id);
              if (exists) return prev;
              return [payload.new as Bookmark, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === payload.new.id ? (payload.new as Bookmark) : b))
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        }
      });

    // Listen for custom events as fallback if real-time doesn't work
    const handleBookmarkAdded = (event: CustomEvent) => {
      const newBookmark = event.detail as Bookmark;
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.id === newBookmark.id);
        if (exists) return prev;
        return [newBookmark, ...prev];
      });
    };

    const handleBookmarkDeleted = () => {
      // Refresh list when bookmark is deleted
      fetchBookmarks();
    };

    window.addEventListener('bookmarkAdded', handleBookmarkAdded as EventListener);
    window.addEventListener('bookmarkDeleted', handleBookmarkDeleted);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('bookmarkAdded', handleBookmarkAdded as EventListener);
      window.removeEventListener('bookmarkDeleted', handleBookmarkDeleted);
    };
  }, [userId, supabase, fetchBookmarks]);

  const handleDelete = async (id: string) => {
    // Optimistic update - remove from UI immediately
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase.from('bookmarks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
      // Revert optimistic update on error
      fetchBookmarks();
    } else {
      // Dispatch event as fallback
      window.dispatchEvent(new CustomEvent('bookmarkDeleted'));
    }
    // Real-time subscription will also update, but optimistic update provides instant feedback
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20">
        <div className="flex flex-col items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">No bookmarks yet</p>
          <p className="text-gray-500">Add your first bookmark above to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Bookmarks <span className="text-gray-400 font-normal text-lg">({bookmarks.length})</span>
          </h2>
        </div>
      </div>
      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="group flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex-1 min-w-0 flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-blue-600 font-semibold text-lg block truncate transition-colors"
                >
                  {bookmark.title}
                </a>
                <p className="text-sm text-gray-500 truncate mt-1">{bookmark.url}</p>
                <div className="flex items-center gap-2 mt-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-gray-400">
                    {new Date(bookmark.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(bookmark.id)}
              className="ml-4 text-red-600 hover:text-white hover:bg-red-600 font-semibold px-4 py-2 rounded-xl transition-all duration-200 border-2 border-red-600 hover:border-red-700 shadow-sm hover:shadow-md"
              title="Delete bookmark"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

