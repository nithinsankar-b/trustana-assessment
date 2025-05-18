// @ts-nocheck

import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '../types/product';
import type { Attribute } from '../types/attribute';
import { getProducts, getAttributes, enrichProducts } from '../services/api';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import EnrichmentStatus from '../components/EnrichmentStatus';
import EnrichButton from '../components/EnrichButton';
import { RefreshCw, Filter, ArrowUp, ArrowDown, Eye } from 'lucide-react';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [enrichmentJobId, setEnrichmentJobId] = useState<number | null>(null);
  const [enrichingProducts, setEnrichingProducts] = useState<number[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [enrichmentSuccess, setEnrichmentSuccess] = useState<boolean | null>(null);
  const [showEnrichmentToast, setShowEnrichmentToast] = useState<boolean>(false);
  
  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState({
    enrichmentStatus: 'all', // 'all', 'enriched', 'not-enriched'
    brand: 'all'
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Sorting states
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  // Get the required attributes (is_required: true)
  const requiredAttributes = useMemo(() => {
    return attributes.filter(attr => attr.isRequired === true);
  }, [attributes]);

  // Fetch products and attributes on component mount or when data needs refreshing
  const fetchData = async () => {
    try {
      if (!loading) { // Don't show refresh indicator if initial loading is true
        setIsRefreshing(true);
      }
      const [productsData, attributesData] = await Promise.all([
        getProducts(),
        getAttributes()
      ]);
      setProducts(productsData);
      setAttributes(attributesData);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fix for modal scroll issue - prevent body scrolling when modal is open
  useEffect(() => {
    if (isAddModalOpen || isFilterModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAddModalOpen, isFilterModalOpen]);

  const toggleProductExpand = (productId: number) => {
    setExpandedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    setFormLoading(true);
    try {
      console.log('▶️ Adding product with data:', productData);
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
  
      console.log('📨 Server response:', response);
  
      if (!response.ok) {
        const errorText = await response.text(); // Read raw body in case it's not JSON
        console.error(`❌ API call failed. Status: ${response.status}, Message: ${errorText}`);
        throw new Error(`Error: ${response.status}`);
      }
  
      const newProduct = await response.json();
      console.log('✅ Product created successfully:', newProduct);
  
      setProducts(prev => [...prev, newProduct]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('🚨 Error creating product:', err);
      setError('Failed to create product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEnrichSingle = async (productId: number) => {
    try {
      // Start showing the product as enriching immediately
      setEnrichingProducts(prev => [...prev, productId]);
      
      // Make the API call with only required attributes
      const requiredAttributeNames = requiredAttributes.map(attr => attr.name);
      const response = await enrichProducts([productId], requiredAttributeNames);
      
      // Update the job ID
      setEnrichmentJobId(response.jobId);
    } catch (err) {
      console.error('Error starting enrichment:', err);
      setError('Failed to start enrichment process');
      // Remove product from the enriching state
      setEnrichingProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // Handler for enrichment job completion
  const handleEnrichmentComplete = (success = true) => {
    setEnrichmentSuccess(success);
    setShowEnrichmentToast(true);
    
    if (success) {
      // Update products when enrichment was successful
      setProducts(prevProducts => 
        prevProducts.map(product => 
          enrichingProducts.includes(product.id)
            ? { ...product, ai_enriched: true } 
            : product
        )
      );
      
      // Refresh data after successful enrichment
      fetchData();
    }
    
    // Clear enriching products state
    setEnrichingProducts([]);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowEnrichmentToast(false);
      // Reset success status after toast disappears
      setTimeout(() => {
        setEnrichmentSuccess(null);
        setEnrichmentJobId(null);
      }, 500);
    }, 3000);
  };

  // Render attribute value based on its type (only if value is not null)
  const renderAttributeValue = (product: Product, attribute: Attribute) => {
    if (!product.attributes || !(attribute.name in product.attributes)) {
      return '-';
    }

    const value = product.attributes[attribute.name];
    
    if (value === null || value === undefined) {
      return '-';
    }

    switch (attribute.type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        return value;
      
      case 'RICH_TEXT':
        return <div dangerouslySetInnerHTML={{ __html: value.toString() }} />;
      
      case 'NUMBER':
        return value;
      
      case 'SINGLE_SELECT':
        return value;
      
      case 'MULTIPLE_SELECT':
        return Array.isArray(value) ? value.join(', ') : value;
      
      case 'MEASURE':
        if (typeof value === 'object' && value !== null && 'value' in value && 'unit' in value) {
          return `${value.value} ${value.unit}`;
        }
        return JSON.stringify(value);
      
      default:
        return JSON.stringify(value);
    }
  };

  // Check if attribute has a non-null value
  const hasNonNullValue = (product: Product, attribute: Attribute) => {
    if (!product.attributes || !(attribute.name in product.attributes)) {
      return false;
    }

    const value = product.attributes[attribute.name];
    return value !== null && value !== undefined;
  };

  const renderProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return (
        <div className="product-image">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="img-thumbnail" 
            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
          />
        </div>
      );
    }
    return (
      <div className="product-image placeholder">
        <div className="placeholder-image" style={{ width: '80px', height: '80px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="text-muted">No image</span>
        </div>
      </div>
    );
  };

  const renderEnrichButton = (product: Product) => {
    const isEnriching = enrichingProducts.includes(product.id);
    
    return (
      <EnrichButton 
        product={product}
        isEnriching={isEnriching}
        onEnrich={handleEnrichSingle}
      />
    );
  };

  // ----- SEARCHING, FILTERING, SORTING & PAGINATION LOGIC -----

  // Extract available brands for filtering
  const availableBrands = useMemo(() => {
    const brands = products
      .map(p => p.brand)
      .filter((brand): brand is string => !!brand);
    return ['all', ...Array.from(new Set(brands))];
  }, [products]);

  // Sort handler
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get the sort direction indicator for the column headers
  const getSortDirectionIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ms-1" /> 
      : <ArrowDown size={12} className="ms-1" />;
  };

  // Apply filtering, sorting, and search to products
  const filteredAndSortedProducts = useMemo(() => {
    // First, apply filtering
    let result = [...products];
    
    // Apply enrichment filter
    if (filterOptions.enrichmentStatus !== 'all') {
      const isEnriched = filterOptions.enrichmentStatus === 'enriched';
      result = result.filter(p => p.ai_enriched === isEnriched);
    }
    
    // Apply brand filter
    if (filterOptions.brand !== 'all') {
      result = result.filter(p => p.brand === filterOptions.brand);
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchLower))
      );
    }
    
    // Then, apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Handle undefined or null values
        if (a[sortConfig.key] === undefined || a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === undefined || b[sortConfig.key] === null) return -1;
        
        // Compare values
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [products, searchTerm, filterOptions, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // UI for pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="pagination-container">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-sm btn-outline-secondary"
        >
          Previous
        </button>
        
        <div className="pagination-pages">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageNum = currentPage - 2 + i;
            
            // Handle edge cases
            if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            }
            
            // Ensure page is in range
            if (pageNum < 1 || pageNum > totalPages) {
              return null;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-sm btn-outline-secondary"
        >
          Next
        </button>
        
        <select 
          value={itemsPerPage} 
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="form-select form-select-sm items-per-page"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    );
  };

  // Filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Products"
      >
        <div className="filter-modal-content">
          <div className="mb-3">
            <label className="form-label">Enrichment Status</label>
            <select 
              className="form-select"
              value={filterOptions.enrichmentStatus}
              onChange={(e) => handleFilterChange('enrichmentStatus', e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="enriched">Enriched Only</option>
              <option value="not-enriched">Not Enriched Only</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Brand</label>
            <select 
              className="form-select"
              value={filterOptions.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>
                  {brand === 'all' ? 'All Brands' : brand}
                </option>
              ))}
            </select>
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button 
              className="btn btn-secondary"
              onClick={() => setIsFilterModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setIsFilterModalOpen(false);
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Render enrichment toast notification
  const renderEnrichmentToast = () => {
    if (!showEnrichmentToast || enrichmentSuccess === null) return null;
    
    return (
      <div className={`enrichment-toast ${enrichmentSuccess ? 'success' : 'error'}`}>
        <div className="toast-content">
          {enrichmentSuccess ? (
            <>
              <span className="toast-icon">✓</span>
              <span className="toast-message">Product enriched successfully</span>
            </>
          ) : (
            <>
              <span className="toast-icon">×</span>
              <span className="toast-message">Enrichment failed</span>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader-container">
          <div className="loader"></div>
          <span>Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const activeFiltersCount = 
    (filterOptions.enrichmentStatus !== 'all' ? 1 : 0) +
    (filterOptions.brand !== 'all' ? 1 : 0);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Products ({filteredAndSortedProducts.length})</h1>
          <div className="d-flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-success"
            >
              Add Product
            </button>
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="btn btn-outline-secondary"
              title="Refresh product list"
            >
              {isRefreshing ? (
                <RefreshCw size={16} className="refresh-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Enrichment Toast Notification */}
        {renderEnrichmentToast()}

        {/* Hidden EnrichmentStatus component to handle job status tracking */}
        {enrichmentJobId && (
          <div style={{ display: 'none' }}>
            <EnrichmentStatus 
              jobId={enrichmentJobId} 
              onCompleted={handleEnrichmentComplete}
            />
          </div>
        )}

        <div className="product-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="form-control"
            />
          </div>
          
          <button 
            className="btn btn-outline-secondary filter-btn"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <Filter size={16} />
            <span className="ms-1">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        <div className="products-grid">
          {currentItems.length === 0 ? (
            <div className="empty-state">
              <p className="text-center text-muted">
                {products.length === 0 
                  ? "No products found" 
                  : "No products match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="product-list">
              <div className="product-list-header">
                <div className="header-image">Image</div>
                <div 
                  className="header-name sortable"
                  onClick={() => requestSort('name')}
                >
                  Name {getSortDirectionIndicator('name')}
                </div>
                <div 
                  className="header-brand sortable"
                  onClick={() => requestSort('brand')}
                >
                  Brand {getSortDirectionIndicator('brand')}
                </div>
                <div 
                  className="header-barcode sortable"
                  onClick={() => requestSort('barcode')}
                >
                  Barcode {getSortDirectionIndicator('barcode')}
                </div>
                <div className="header-enrich">AI Status</div>
                <div className="header-actions">Actions</div>
              </div>

              {currentItems.map(product => {
                const isExpanded = expandedProducts.includes(product.id);
                
                return (
                  <div key={product.id} className="product-card">
                    <div className="product-summary">
                      <div className="product-image-cell">
                        {renderProductImage(product)}
                      </div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-brand">{product.brand || '-'}</div>
                      <div className="product-barcode">{product.barcode || '-'}</div>
                      <div className="product-enrich">
                        {renderEnrichButton(product)}
                      </div>
                      <div className="product-actions">
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={() => toggleProductExpand(product.id)}
                          title={isExpanded ? "Hide details" : "View details"}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="product-details">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Attribute</th>
                              <th>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Only show attributes with non-null values */}
                            {attributes
                              .filter(attr => hasNonNullValue(product, attr))
                              .map(attr => (
                                <tr key={attr.id}>
                                  <td>{attr.name}</td>
                                  <td>{renderAttributeValue(product, attr)}</td>
                                </tr>
                              ))
                            }
                            {attributes.filter(attr => hasNonNullValue(product, attr)).length === 0 && (
                              <tr>
                                <td colSpan={2} className="text-center text-muted">No attribute data available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {product.images && product.images.length > 1 && (
                          <div className="product-images-gallery">
                            <h6>All Images</h6>
                            <div className="d-flex gap-2 flex-wrap">
                              {product.images.map((img, idx) => (
                                <div key={idx} className="product-gallery-image">
                                  <img 
                                    src={img} 
                                    alt={`${product.name} - ${idx + 1}`} 
                                    className="img-thumbnail" 
                                    style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {renderPagination()}
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
      >
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setIsAddModalOpen(false)}
          isLoading={formLoading}
        />
      </Modal>

      {renderFilterModal()}

      <style jsx>{`
        .products-grid {
          margin-top: 1rem;
        }
        
        .product-controls {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
        }
        
        .search-container {
          flex: 1;
        }
        
        .filter-btn {
          display: flex;
          align-items: center;
          position: relative;
        }
.product-actions {
  padding-left: 10px;
}

        .filter-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #dc3545;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .product-list-header {
          display: grid;
          grid-template-columns: 100px 1fr 150px 150px 120px 80px;
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          font-weight: bold;
        }
        
        .sortable {
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        
        .sortable:hover {
          background-color: #e9ecef;
        }
        
        .product-card {
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          margin-bottom: 0.75rem;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .product-summary {
          display: grid;
          grid-template-columns: 100px 1fr 150px 150px 120px 80px;
          padding: 0.75rem 1rem;
          align-items: center;
        }
        
        .product-details {
          padding: 1rem;
          border-top: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }
        
        .product-name {
          font-weight: 500;
        }
        
        .empty-state {
          padding: 3rem 1rem;
          text-align: center;
        }
        
        .product-images-gallery {
          margin-top: 1rem;
        }
        
        .product-enrich {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .badge-success {
          background-color: #28a745;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          display: inline-block;
        }
        
        /* Add this style to ensure gap-1 works correctly */
        .gap-1 {
          gap: 0.25rem;
        }
        
        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
          border-width: 0.2em;
        }
        
        .me-1 {
          margin-right: 0.25rem;
        }

        .me-2 {
          margin-right: 0.5rem;
        }
        
        .ms-1 {
          margin-left: 0.25rem;
        }
        
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        
        .pagination-pages {
          display: flex;
          gap: 0.25rem;
        }
        
        .items-per-page {
          margin-left: 1rem;
          width: auto;
        }
        
        /* Smooth refresh animation */
        .refresh-spin {
          animation: spin 1s infinite linear;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Enrichment toast notification */
        .enrichment-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 4px;
          z-index: 1050;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          animation: slideIn 0.3s ease-out;
        }
        
        .enrichment-toast.success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .enrichment-toast.error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
        }


      `}</style>
    </div>
  );
};

export default ProductList;