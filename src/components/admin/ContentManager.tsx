import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

export function ContentManager() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    content: '',
    type: 'text' as const,
    page: 'home',
  });

  const pages = ['home', 'about', 'contact', 'help', 'policies', 'shipping', 'other'];
  const contentTypes = ['text', 'rich-text', 'image', 'json'];

  // Load all content
  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content');
      if (!response.ok) throw new Error('Failed to load content');
      const data = await response.json();
      setContents(data);
    } catch (err: any) {
      toast.error('Error loading content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Create or update content
  const handleSave = async () => {
    if (!formData.key || !formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingId ? `/api/content/${editingId}` : '/api/content';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save content');
      await loadContent();
      toast.success(editingId ? 'Content updated' : 'Content created');
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete content
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const response = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete content');
      await loadContent();
      toast.success('Content deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Edit content
  const handleEdit = (item: ContentItem) => {
    setFormData({
      key: item.key,
      title: item.title,
      content: item.content,
      type: item.type,
      page: item.page,
    });
    setEditingId(item.id);
  };

  const resetForm = () => {
    setFormData({
      key: '',
      title: '',
      content: '',
      type: 'text',
      page: 'home',
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-foreground mb-4">Content Management</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage all website content from here. Changes are instantly reflected on user pages.
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border p-6 space-y-4">
        <h3 className="font-medium text-foreground">
          {editingId ? 'Edit Content' : 'Add New Content'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Content Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., homepage_hero_title"
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Display name for this content"
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Page
            </label>
            <select
              value={formData.page}
              onChange={(e) => setFormData({ ...formData, page: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
            >
              {pages.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ContentItem['type'],
                })
              }
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
            >
              {contentTypes.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
            Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter content here..."
            rows={6}
            className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm font-mono"
          />
        </div>

        <div className="flex gap-2 justify-end">
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" /> {editingId ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>

      {/* Content List */}
      <div>
        <h3 className="font-medium text-foreground mb-4">All Content</h3>
        <div className="bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading...</div>
          ) : contents.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No content yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Key</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Page</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Updated</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.key}
                      </td>
                      <td className="px-4 py-3">{item.title}</td>
                      <td className="px-4 py-3 capitalize">{item.page}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
