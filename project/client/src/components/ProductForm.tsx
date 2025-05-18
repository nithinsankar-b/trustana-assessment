
import React, { useState, useEffect, useRef } from 'react';
import type { Product } from '../types/product';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Partial<Product>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    barcode: '',
    images: [],
    attributes: {}
  });
  
  const [previewImages, setPreviewImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({ ...product });
      
      // If product has images, create preview URLs for them
      if (product.images && product.images.length > 0) {
        const previews = product.images.map(imageUrl => ({
          file: new File([], "existing-image"), // Placeholder file object
          preview: imageUrl
        }));
        setPreviewImages(previews);
      }
    }
  }, [product]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previewImages.forEach(image => {
        // Only revoke if it's a blob URL (not a remote URL)
        if (image.preview.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [previewImages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    
    // Create preview URLs for the new files
    const newPreviews = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    // Update preview state
    setPreviewImages(prev => [...prev, ...newPreviews]);
    
    // Reset file input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setPreviewImages(prev => {
      // If it's a blob URL, revoke it to free up memory
      if (prev[index].preview.startsWith('blob:')) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the product data with the image information
    const productToSubmit: Partial<Product> = {
        name: formData.name?.trim() || null,
        brand: formData.brand?.trim() || null,
        barcode: formData.barcode?.trim() || null,
        attributes: Object.keys(formData.attributes || {}).length > 0 ? formData.attributes : null
      };
    
    // Convert file objects to base64 if they're new uploads
    const imagePromises = previewImages.map(async (image) => {
      // If it's an existing image URL, just return it
      if (!image.preview.startsWith('blob:')) {
        return image.preview;
      }
      
      // Otherwise convert the file to base64
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(image.file);
      });
    });
    
    // Wait for all image conversions to complete
    const imageUrls = await Promise.all(imagePromises);
    productToSubmit.images = imageUrls;
    
    // Submit the product data
    onSubmit(productToSubmit);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group mb-3">
        <label className="form-label">Product Name</label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Brand</label>
        <input
          type="text"
          name="brand"
          value={formData.brand || ''}
          onChange={handleChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Barcode</label>
        <input
          type="text"
          name="barcode"
          value={formData.barcode || ''}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Product Images</label>
        <div className="image-upload-container">
          <div className="image-upload-button">
            <input
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              ref={fileInputRef}
              className="file-input"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-outline-primary d-flex align-items-center gap-2"
            >
              <Upload size={16} />
              <span>Upload Images</span>
            </button>
          </div>
          
          {previewImages.length > 0 && (
            <div className="image-previews mt-3">
              <div className="d-flex flex-wrap gap-3">
                {previewImages.map((image, index) => (
                  <div key={index} className="image-preview-item position-relative">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="img-thumbnail"
                      style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="btn btn-sm btn-danger position-absolute top-0 end-0"
                      style={{ margin: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {previewImages.length === 0 && (
            <div className="no-images-placeholder mt-3 text-center p-4 border rounded bg-light">
              <ImageIcon size={32} className="text-muted mb-2" />
              <p className="text-muted mb-0">No images uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="form-actions mt-4 d-flex justify-content-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;