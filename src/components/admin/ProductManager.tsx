import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Upload, Sparkles } from 'lucide-react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { toast } from 'sonner';

interface ProductManagerProps {
  onProductsChange?: (products: Product[]) => void;
}

interface FormDataWithImages extends Omit<Product, 'id'> {
  discount?: number;
  originalPrice?: number;
  returnWindowDays?: number;
}

const defaultProduct: FormDataWithImages = {
  name: '',
  price: 0,
  originalPrice: 0,
  discount: 0,
  category: 'men',
  subcategory: '',
  fabric: '',
  fit: 'Regular',
  fitType: 'none',
  sizes: ['S', 'M', 'L', 'XL'],
  images: ['/placeholder.svg'],
  isNew: true,
  isBestSeller: false,
  isPreOrder: false,
  preOrderMessage: '',
  description: '',
  careInstructions: [],
  composition: '',
  deliveryReturns: '',
  returnWindowDays: 30,
};

export function ProductManager({ onProductsChange }: ProductManagerProps) {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataWithImages>(defaultProduct);
  const [imageUrls, setImageUrls] = useState<string[]>(['/placeholder.svg']);
  const [searchTerm, setSearchTerm] = useState('');
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  // Fetch measurements when fitType changes
  useEffect(() => {
    if (formData.fitType && formData.fitType !== 'none') {
      fetchMeasurements(formData.fitType);
      setSelectedMeasurements([]);
    } else {
      setMeasurements([]);
      setSelectedMeasurements([]);
    }
  }, [formData.fitType]);

  const fetchMeasurements = async (fitType: string) => {
    console.log(`🔄 Fetching ${fitType} measurements...`);
    setLoadingMeasurements(true);
    try {
      const response = await fetch(`/api/measurements?fitType=${fitType}`);
      console.log(`API Response status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Fetched ${fitType} measurements:`, data);
        console.log(`📊 Measurement count: ${data.length}`);
        setMeasurements(data);
      } else {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        setMeasurements([]);
      }
    } catch (err) {
      console.error('Error fetching measurements:', err);
      setMeasurements([]);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData(defaultProduct);
    setImageUrls(['/placeholder.svg']);
    setSelectedMeasurements([]);
    setMeasurements([]);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      discount: product.discount || 0,
      category: product.category,
      subcategory: product.subcategory || '',
      fabric: product.fabric || '',
      fit: product.fit || 'Regular',
      fitType: product.fitType || 'none',
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      images: product.images || ['/placeholder.svg'],
      isNew: product.isNew || false,
      isBestSeller: product.isBestSeller || false,
      isPreOrder: product.isPreOrder || false,
      preOrderMessage: product.preOrderMessage || '',
      description: product.description || '',
      careInstructions: product.careInstructions || [],
      composition: product.composition || '',
      deliveryReturns: product.deliveryReturns || '',
      returnWindowDays: product.returnWindowDays || 30,
      tailoredFitMeasurements: product.tailoredFitMeasurements || [],
    });
    setSelectedMeasurements((product.tailoredFitMeasurements as string[]) || []);
    setImageUrls(product.images || ['/placeholder.svg']);
    setIsFormOpen(true);
  };

  const handleImageAdd = (url: string) => {
    if (url && url.trim()) {
      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        toast.error('Please enter a valid image URL (http://, https://, or /)');
        return;
      }
      // Filter out placeholder if adding real image URL
      const current = imageUrls.filter((img) => img !== '/placeholder.svg');
      if (!current.includes(url)) {
        const updated = [...current, url];
        setImageUrls(updated);
        setFormData({ ...formData, images: updated });
        toast.success('Image URL added');
      } else {
        toast.info('This image URL is already added');
      }
    }
  };

  const handleImageRemove = (index: number) => {
    let newImages = imageUrls.filter((_, i) => i !== index);
    if (newImages.length === 0) {
      newImages = ['/placeholder.svg'];
    }
    setImageUrls(newImages);
    setFormData({ ...formData, images: newImages });
  };

  const handleDiscountChange = (discount: number) => {
    const originalPrice = formData.originalPrice || formData.price;
    const newPrice = originalPrice - (originalPrice * discount) / 100;
    setFormData({
      ...formData,
      discount,
      originalPrice,
      price: Math.round(newPrice),
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in name and price');
      return;
    }

    // Validate that at least one real image is added (not placeholder)
    const hasRealImages = imageUrls.some(img => img !== '/placeholder.svg');
    if (!hasRealImages) {
      toast.error('⚠️ Please add at least one product image URL before saving');
      return;
    }

    const productData: Product = {
      ...formData,
      images: imageUrls.length > 0 ? imageUrls : ['/placeholder.svg'],
      tailoredFitMeasurements: selectedMeasurements.length > 0 ? selectedMeasurements : undefined,
      id: editingId || Date.now().toString(),
    } as Product;

    if (editingId) {
      await updateProduct(productData);
    } else {
      await addProduct(productData);
    }

    onProductsChange?.(products);
    setIsFormOpen(false);
    setFormData(defaultProduct);
    setImageUrls(['/placeholder.svg']);
    setSelectedMeasurements([]);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product from the catalog?')) {
      await deleteProduct(id);
      onProductsChange?.(products.filter((p) => p.id !== id));
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search products by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[260px] px-4 py-2.5 border border-border bg-card text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
        />
        <Button variant="add" onClick={handleAddClick} className="gap-2 text-xs uppercase tracking-wider py-5 px-6 rounded-none">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground uppercase tracking-widest animate-pulse">
          Loading catalog...
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background-cream/50 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Fabric</th>
                <th className="px-6 py-4 font-medium">Sizes</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground uppercase tracking-wider">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-background-cream/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="h-12 w-12 object-cover border border-border bg-secondary"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-serif text-base">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-xs text-muted-foreground">
                      {product.category} &middot; {product.subcategory}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {product.isNew && (
                          <span className="px-2 py-0.5 border border-foreground text-[10px] uppercase tracking-[0.1em] text-foreground">
                            New
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="px-2 py-0.5 border border-primary text-[10px] uppercase tracking-[0.1em] text-primary">
                            Bestseller
                          </span>
                        )}
                        {product.isPreOrder && (
                          <span className="px-2 py-0.5 border border-blue-200 bg-blue-50 text-[10px] uppercase tracking-[0.1em] text-blue-700">
                            Pre-order
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">₹{product.price}</span>
                        {product.discount ? (
                          <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                            <span className="line-through text-muted-foreground">₹{product.originalPrice}</span>
                            <span className="text-red-600 font-semibold">{product.discount}% off</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {product.fabric}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.sizes?.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 border border-border text-[10px] font-mono text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-2 hover:bg-background-cream rounded transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded transition-colors text-muted-foreground hover:text-red-600"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsFormOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="relative w-full max-w-2xl bg-card border border-border shadow-mega max-h-[90vh] overflow-y-auto rounded-none"
            >
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="text-xl font-serif text-foreground">
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-background-cream transition-colors rounded-none"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Name */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="e.g., Tailored Wool Blazer"
                  />
                </div>

                {/* Price & Discount */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Base Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.originalPrice || 0}
                      onChange={(e) => {
                        const original = Number(e.target.value);
                        const discount = formData.discount || 0;
                        const price = original - (original * discount) / 100;
                        setFormData({
                          ...formData,
                          originalPrice: original,
                          price: Math.round(price),
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      placeholder="e.g., 495"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount || 0}
                      onChange={(e) => handleDiscountChange(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Final Selling Price (₹)</label>
                    <div className="px-4 py-2.5 bg-background-cream border border-border text-sm font-semibold text-foreground">
                      ₹{formData.price || 0}
                    </div>
                  </div>
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="essentials">Essentials</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Subcategory *</label>
                    <input
                      type="text"
                      required
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      placeholder="e.g., blazers, knitwear"
                    />
                  </div>
                </div>

                {/* Product Status */}
                <div className="space-y-4 border border-border bg-background-cream/40 p-4">
                  <label className="text-xs uppercase tracking-wider font-semibold block text-muted-foreground">Product Status</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { key: 'isNew', label: 'New In' },
                      { key: 'isBestSeller', label: 'Bestseller' },
                      { key: 'isPreOrder', label: 'Pre-order' },
                    ].map((option) => (
                      <label key={option.key} className="flex items-center gap-3 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={Boolean((formData as any)[option.key])}
                          onChange={(e) => setFormData({ ...formData, [option.key]: e.target.checked } as FormDataWithImages)}
                          className="h-4 w-4 accent-primary"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  {formData.isPreOrder && (
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Pre-order Message</label>
                      <input
                        type="text"
                        value={formData.preOrderMessage || ''}
                        onChange={(e) => setFormData({ ...formData, preOrderMessage: e.target.value })}
                        className="w-full px-4 py-2.5 border border-border bg-card text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                        placeholder="e.g., Ships in 3-4 weeks"
                      />
                    </div>
                  )}
                </div>

                {/* Fabric, Fit, Fit Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Fabric</label>
                    <input
                      type="text"
                      value={formData.fabric}
                      onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      placeholder="e.g., Wool"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Fit</label>
                    <input
                      type="text"
                      value={formData.fit}
                      onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      placeholder="e.g., Slim"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Tailored Fit Type</label>
                    <select
                      value={formData.fitType || 'none'}
                      onChange={(e) => setFormData({ ...formData, fitType: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    >
                      <option value="none">None</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </div>



                {/* Tailored Fit Measurements Selection */}
                {formData.fitType && formData.fitType !== 'none' && (
                  <div className="space-y-4 p-5 border-2 border-primary/30 bg-primary/5 rounded">
                    <div className="flex items-center justify-between">
                      <label className="text-sm uppercase tracking-wider font-semibold text-foreground">
                        Select {formData.fitType === 'top' ? 'Top' : 'Bottom'} Measurements
                      </label>
                      {measurements.length > 0 && (
                        <span className="text-xs text-primary font-medium">
                          {selectedMeasurements.length} of {measurements.length} selected
                        </span>
                      )}
                    </div>
                    
                    {loadingMeasurements ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground animate-pulse">Loading {formData.fitType} measurements...</p>
                      </div>
                    ) : measurements.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-border rounded">
                        <p className="text-sm text-muted-foreground">No measurements available for this fit type</p>
                        <p className="text-xs text-muted-foreground mt-1">Create measurements in the Measurements tab first</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto bg-background-cream/50 p-3 rounded">
                        {measurements.map((m) => (
                          <label key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-background-cream cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedMeasurements.includes(m.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMeasurements([...selectedMeasurements, m.id]);
                                } else {
                                  setSelectedMeasurements(selectedMeasurements.filter((id) => id !== m.id));
                                }
                              }}
                              className="w-5 h-5 border border-border rounded accent-primary cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-foreground block">{m.name}</span>
                              <span className="text-xs text-muted-foreground">{m.description}</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-background-cream border border-border rounded font-mono text-primary">
                              {m.datatype}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Images */}
                <div className="space-y-3">
                  <div className="border-2 border-primary/40 bg-primary/5 p-4 rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="text-xs uppercase tracking-wider font-semibold block text-foreground mb-1">
                          ⭐ Product Images (Required)
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Use URLs from Cloudinary, Imgur, AWS S3, or other CDN services. Paste URL and press Enter.
                        </p>
                      </div>
                      {imageUrls.some(img => img !== '/placeholder.svg') && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold whitespace-nowrap">
                          ✓ {imageUrls.filter(img => img !== '/placeholder.svg').length}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://res.cloudinary.com/yourname/image/upload/v123/product.jpg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const url = input.value.trim();
                          if (!url) {
                            toast.error('Please enter an image URL');
                            return;
                          }
                          handleImageAdd(url);
                          input.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const inputs = document.querySelectorAll('input[type="text"]');
                        const input = Array.from(inputs).find(i => (i as HTMLInputElement).placeholder.includes('cloudinary')) as HTMLInputElement;
                        if (input) {
                          const url = input.value.trim();
                          if (!url) {
                            toast.error('Please enter an image URL');
                            return;
                          }
                          handleImageAdd(url);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-wider font-semibold transition-colors rounded-none"
                    >
                      Add
                    </button>
                  </div>

                  {/* Image Preview Grid */}
                  {imageUrls.filter(img => img !== '/placeholder.svg').length === 0 ? (
                    <div className="p-6 border-2 border-red-200 bg-red-50 text-center rounded">
                      <p className="text-sm font-semibold text-red-700 mb-1">❌ No Images Added</p>
                      <p className="text-xs text-red-600">You MUST add at least one image URL before saving</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {imageUrls.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-square border-2 border-border bg-secondary overflow-hidden rounded">
                            <img 
                              src={img} 
                              alt={`Product ${idx}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleImageRemove(idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-full opacity-0 group-hover:opacity-100 shadow-md"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-700">
                    <p className="font-semibold mb-1">💡 Get Image URLs (FREE):</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li><strong>Cloudinary</strong>: Sign up free → Upload image → Copy URL</li>
                      <li><strong>Imgur</strong>: Upload at imgur.com → Right-click image → Copy Image Address</li>
                      <li><strong>AWS S3</strong>: Create S3 bucket → Upload → Copy public URL</li>
                    </ul>
                  </div>
                </div>

                {/* Product Content Sections */}
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      rows={3}
                      placeholder="Describe the product details..."
                    />
                  </div>

                  {/* Composition & Fabric */}
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Composition & Fabric</label>
                    <textarea
                      value={formData.composition}
                      onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      rows={2}
                      placeholder="e.g., 100% Virgin Wool, Premium Italian Fabric..."
                    />
                  </div>

                  {/* Care Instructions */}
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Care Instructions</label>
                    <textarea
                      value={formData.careInstructions?.join('\n') || ''}
                      onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value.split('\n').filter(i => i.trim()) })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      rows={3}
                      placeholder="One instruction per line\ne.g.\nDry clean only\nDo not bleach\nIron on low heat"
                    />
                  </div>

                  {/* Delivery & Returns */}
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Delivery & Returns</label>
                    <textarea
                      value={formData.deliveryReturns}
                      onChange={(e) => setFormData({ ...formData, deliveryReturns: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                      rows={2}
                      placeholder="e.g., Free shipping over ₹200, 30-day return policy"
                    />
                  </div>

                  {/* Return Window Days */}
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Return Window (Days)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={formData.returnWindowDays || 30}
                        onChange={(e) => setFormData({ ...formData, returnWindowDays: Number(e.target.value) })}
                        className="flex-1 px-4 py-2.5 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                        placeholder="e.g., 30"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">days after purchase</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground italic">
                      Customers can only return this product within the specified number of days from purchase date. The return option will not be shown after this period expires.
                    </p>
                  </div>
                </div>

                {/* Sizes Selection */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold block mb-2 text-muted-foreground">Available Sizes</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '85', '90', '95', '100', '105', 'One Size'].map((size) => {
                      const isSelected = formData.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({ ...formData, sizes: formData.sizes.filter((s) => s !== size) });
                            } else {
                              setFormData({ ...formData, sizes: [...formData.sizes, size] });
                            }
                          }}
                          className={`px-3 py-1.5 border text-xs font-mono transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card z-10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2 text-xs uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <Button variant="add" onClick={handleSave} className="gap-2 text-xs uppercase tracking-wider py-5 px-6 rounded-none">
                  <Save className="h-4 w-4" />
                  {editingId ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
