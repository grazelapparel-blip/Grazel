import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentItem {
  id: string;
  key: string;
  title: string;
  content: string;
  type: 'text' | 'rich-text' | 'image' | 'json';
  page: string;
  status?: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  published: { label: 'Published', color: 'text-green-700 bg-green-50 border-green-200' },
  draft: { label: 'Draft', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  archived: { label: 'Archived', color: 'text-muted-foreground bg-secondary border-border' },
};

function StatusBadge({ status = 'published' }: { status?: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.published;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border p-6 w-full max-w-sm shadow-mega"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-wider hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ContentManager() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPage, setFilterPage] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    content: '',
    type: 'text' as ContentItem['type'],
    page: 'home',
    status: 'published' as 'draft' | 'published' | 'archived',
  });

  const pages = ['home', 'about', 'contact', 'help', 'policies', 'shipping', 'other'];
  const contentTypes = ['text', 'rich-text', 'image', 'json'];

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

  const handleSave = async () => {
    if (!formData.key || !formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
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
      toast.success(editingId ? 'Content updated successfully' : 'Content created successfully');
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete content');
      await loadContent();
      toast.success('Content deleted');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (item: ContentItem) => {
    setFormData({
      key: item.key,
      title: item.title,
      content: item.content,
      type: item.type,
      page: item.page,
      status: item.status ?? 'published',
    });
    setEditingId(item.id);
    // Scroll to form
    document.getElementById('content-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetForm = () => {
    setFormData({ key: '', title: '', content: '', type: 'text', page: 'home', status: 'published' });
    setEditingId(null);
  };

  // Filtered & searched content
  const filtered = contents.filter((item) => {
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.key.toLowerCase().includes(search.toLowerCase());
    const matchPage = filterPage === 'all' || item.page === filterPage;
    const matchType = filterType === 'all' || item.type === filterType;
    return matchSearch && matchPage && matchType;
  });

  const previewItem = contents.find((c) => c.id === previewId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Content Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all website content. Changes reflect live on user-facing pages.
          </p>
        </div>
        <button
          onClick={loadContent}
          disabled={loading}
          className="p-2 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Form ── */}
      <div id="content-form" className="bg-card border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground text-sm uppercase tracking-[0.12em]">
            {editingId ? '✏️ Editing Content' : '+ Add New Content'}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Content Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., homepage_hero_title"
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm font-mono"
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
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentItem['type'] })}
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
            >
              {contentTypes.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
              className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
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
            rows={5}
            className="w-full px-3 py-2 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm font-mono"
          />
        </div>

        <div className="flex gap-2 justify-end">
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : editingId ? 'Update Content' : 'Create Content'}
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or key..."
            className="w-full pl-9 pr-3 py-2 border border-border bg-card text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-4 w-4" />
          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            className="px-3 py-2 border border-border bg-card text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Pages</option>
            {pages.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-border bg-card text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            {contentTypes.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {contents.length} entries
        </span>
      </div>

      {/* ── Content Table ── */}
      <div>
        <div className="bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <RefreshCw className="h-6 w-6 mx-auto animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Loading content...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <p className="text-sm">{search || filterPage !== 'all' || filterType !== 'all' ? 'No content matches your filters.' : 'No content yet. Create your first entry above.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-border-light hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                        {item.key}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                      <td className="px-4 py-3 capitalize text-xs text-muted-foreground">{item.page}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setPreviewId(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Modal ── */}
      <AnimatePresence>
        {previewId && previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setPreviewId(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              className="relative bg-card border border-border p-6 w-full max-w-lg shadow-mega max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg">{previewItem.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{previewItem.key}</p>
                </div>
                <button onClick={() => setPreviewId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <StatusBadge status={previewItem.status} />
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-semibold border border-border text-muted-foreground bg-secondary">
                  {previewItem.type}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-semibold border border-border text-muted-foreground bg-secondary">
                  {previewItem.page}
                </span>
              </div>
              <div className="bg-background-cream border border-border p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{previewItem.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Last updated: {new Date(previewItem.updatedAt).toLocaleString()}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Content"
        message="This action cannot be undone. The content entry will be permanently removed from the database."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
