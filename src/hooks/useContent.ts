import { useState, useEffect } from 'react';

interface ContentItem {
  id: string;
  key: string;
  title: string;
  content: string;
  type: 'text' | 'rich-text' | 'image' | 'json';
  page: string;
  createdAt: string;
  updatedAt: string;
}

export function useContent(contentKey?: string, page?: string) {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentKey && !page) return;

    setLoading(true);
    setError(null);

    const fetchContent = async () => {
      try {
        let url = '/api/content';

        if (contentKey) {
          url = `/api/content/key/${contentKey}`;
        } else if (page) {
          url = `/api/content/page/${page}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();

        if (contentKey) {
          setContent(data);
        } else {
          setContents(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentKey, page]);

  return { content, contents, loading, error };
}
