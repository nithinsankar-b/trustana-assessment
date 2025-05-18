import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAttributes, deleteAttribute } from '../services/api';
import Modal from '../components/Modal';
import AttributeForm from '../components/AttributeForm';
import { Edit, Trash2, RefreshCw, Filter, ArrowUp, ArrowDown } from 'lucide-react';

const AttributeList = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    type: 'all',
    enabled: 'all',
    source: 'all' // 'all', 'system', 'user'
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting states
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  useEffect(() => {
    loadAttributes();
  }, []);

  // Fix for scrolling issue - manage body scroll lock when modal is open
  useEffect(() => {
    if (showModal || isFilterModalOpen) {
      // Disable scroll on body
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scroll on body when modal is closed
      document.body.style.overflow = '';
    }

    // Cleanup function to ensure scroll is restored when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, isFilterModalOpen]);

  const loadAttributes = async () => {
    try {
      if (!loading) {
        setIsRefreshing(true);
      }
      setLoading(true);
      const data = await getAttributes();
      
      // Map the API data to normalize field names
      const normalizedData = data.map(attr => ({
        ...attr,
        // Ensure field names match what the component expects
        isSystemGenerated: attr.systemGenerated !== undefined ? attr.systemGenerated : attr.isSystemGenerated
      }));
      
      setAttributes(normalizedData);
      setError(null);
    } catch (err) {
      setError('Failed to load attributes');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddAttribute = () => {
    setEditingAttribute(undefined);
    setShowModal(true);
  };

  const handleEditAttribute = (attribute) => {
    setEditingAttribute(attribute);
    setShowModal(true);
  };

  const handleDeleteAttribute = async (id) => {
    if (window.confirm('Are you sure you want to delete this attribute?')) {
      try {
        await deleteAttribute(id);
        setAttributes(attributes.filter(attr => attr.id !== id));
      } catch (err) {
        setError('Failed to delete attribute');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (attribute) => {
    setFormLoading(true);
    try {
      if (editingAttribute) {
        // Convert from isSystemGenerated to systemGenerated if needed for API
        const apiAttribute = {
          ...attribute,
          systemGenerated: attribute.isSystemGenerated,
        };
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/attributes/${editingAttribute.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiAttribute),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const updatedAttribute = await response.json();
        
        // Ensure field names match what the component expects
        const normalizedAttribute = {
          ...updatedAttribute,
          isSystemGenerated: updatedAttribute.systemGenerated !== undefined ? 
            updatedAttribute.systemGenerated : updatedAttribute.isSystemGenerated
        };
        
        setAttributes(prev => prev.map(attr => 
          attr.id === normalizedAttribute.id ? normalizedAttribute : attr
        ));
      } else {
        // Set system-generated to false for new attributes
        const newAttributeData = {
          ...attribute,
          // Use both for compatibility
          systemGenerated: false,
          isSystemGenerated: false
        };
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/attributes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAttributeData),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const newAttribute = await response.json();
        
        // Ensure field names match what the component expects
        const normalizedAttribute = {
          ...newAttribute,
          isSystemGenerated: newAttribute.systemGenerated !== undefined ? 
            newAttribute.systemGenerated : newAttribute.isSystemGenerated
        };
        
        setAttributes(prev => [...prev, normalizedAttribute]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving attribute:', err);
      setError('Failed to save attribute');
    } finally {
      setFormLoading(false);
    }
  };

  const renderAttributeType = (type) => {
    const typeMap = {
      'SHORT_TEXT': 'Short Text',
      'LONG_TEXT': 'Long Text',
      'RICH_TEXT': 'Rich Text',
      'NUMBER': 'Number',
      'SINGLE_SELECT': 'Single Select',
      'MULTIPLE_SELECT': 'Multiple Select',
      'MEASURE': 'Measure'
    };
    
    return typeMap[type] || type;
  };

  // Sort handler
  const requestSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get the sort direction indicator for the column headers
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ms-1" /> 
      : <ArrowDown size={12} className="ms-1" />;
  };

  // Extract available attribute types for filtering
  const availableTypes = useMemo(() => {
    const types = attributes
      .map(a => a.type)
      .filter(type => !!type);
    return ['all', ...Array.from(new Set(types))];
  }, [attributes]);

  // Apply filtering, sorting, and search to attributes
  const filteredAndSortedAttributes = useMemo(() => {
    // First, apply filtering
    let result = [...attributes];
    
    // Apply type filter
    if (filterOptions.type !== 'all') {
      result = result.filter(a => a.type === filterOptions.type);
    }
    
    // Apply enabled filter
    if (filterOptions.enabled !== 'all') {
      const isRequired = filterOptions.enabled === 'enabled';
      result = result.filter(a => a.isRequired === isRequired);
    }
    
    // Apply source filter (system vs user)
    if (filterOptions.source !== 'all') {
      const isSystemGenerated = filterOptions.source === 'system';
      // Debug to check what's happening with the filter
      console.log('Filtering for systemGenerated:', isSystemGenerated);
      console.log('Sample attribute:', result[0]?.isSystemGenerated);
      
      result = result.filter(a => {
        // First check if we have the property at all
        if (a.isSystemGenerated === undefined && a.systemGenerated === undefined) {
          console.warn('Attribute missing systemGenerated property:', a);
          return false;
        }
        
        // Use either property based on what's available
        const systemGenValue = a.isSystemGenerated !== undefined ? 
          a.isSystemGenerated : a.systemGenerated;
          
        return systemGenValue === isSystemGenerated;
      });
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(searchLower) ||
        (a.unit && a.unit.toLowerCase().includes(searchLower))
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
  }, [attributes, searchTerm, filterOptions, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedAttributes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedAttributes.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (name, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Improve modal closing to ensure scroll is restored
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    // Ensure scrolling is re-enabled
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 100);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
    // Ensure scrolling is re-enabled
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 100);
  }, []);

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
        onClose={handleCloseFilterModal}
        title="Filter Attributes"
      >
        <div className="filter-modal-content">
          <div className="mb-3">
            <label className="form-label">Attribute Type</label>
            <select 
              className="form-select"
              value={filterOptions.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              {availableTypes.filter(type => type !== 'all').map(type => (
                <option key={type} value={type}>
                  {renderAttributeType(type)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Status</label>
            <select 
              className="form-select"
              value={filterOptions.enabled}
              onChange={(e) => handleFilterChange('enabled', e.target.value)}
            >
              <option value="all">All Attributes</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Source</label>
            <select 
              className="form-select"
              value={filterOptions.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="system">System Generated</option>
              <option value="user">User Generated</option>
            </select>
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button 
              className="btn btn-secondary"
              onClick={handleCloseFilterModal}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                handleCloseFilterModal();
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  if (loading && !isRefreshing) {
    return (
      <div className="container">
        <div className="loader-container">
          <div className="loader"></div>
          <span>Loading attributes...</span>
        </div>
      </div>
    );
  }

  const activeFiltersCount = 
    (filterOptions.type !== 'all' ? 1 : 0) +
    (filterOptions.enabled !== 'all' ? 1 : 0) +
    (filterOptions.source !== 'all' ? 1 : 0);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Attributes ({filteredAndSortedAttributes.length})</h1>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={handleAddAttribute}
            >
              Add Attribute
            </button>
            <button
              onClick={loadAttributes}
              disabled={isRefreshing}
              className="btn btn-outline-secondary"
              title="Refresh attribute list"
            >
              {isRefreshing ? (
                <RefreshCw size={16} className="refresh-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="attribute-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search attributes..."
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

        <div className="attributes-grid">
          {currentItems.length === 0 ? (
            <div className="empty-state">
              <p className="text-center text-muted">
                {attributes.length === 0 
                  ? "No attributes found" 
                  : "No attributes match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="attribute-list">
              <div className="attribute-list-header">
                <div 
                  className="header-name sortable"
                  onClick={() => requestSort('name')}
                >
                  Name {getSortDirectionIndicator('name')}
                </div>
                <div 
                  className="header-type sortable"
                  onClick={() => requestSort('type')}
                >
                  Type {getSortDirectionIndicator('type')}
                </div>
                <div className="header-unit">Unit</div>
                <div 
                  className="header-enabled sortable"
                  onClick={() => requestSort('isRequired')}
                >
                  Status {getSortDirectionIndicator('isRequired')}
                </div>
                <div 
                  className="header-source sortable"
                  onClick={() => requestSort('isSystemGenerated')}
                >
                  Source {getSortDirectionIndicator('isSystemGenerated')}
                </div>
                <div className="header-actions">Actions</div>
              </div>

              {currentItems.map(attribute => (
                <div key={attribute.id} className="attribute-card">
                  <div className="attribute-summary">
                    <div className="attribute-name">{attribute.name}</div>
                    <div className="attribute-type">{renderAttributeType(attribute.type)}</div>
                    <div className="attribute-unit">{attribute.unit || '-'}</div>
                    <div className="attribute-enabled">
                      {attribute.isRequired ? 
                        <span className="badge bg-primary">Enabled</span> : 
                        <span className="badge bg-secondary">Disabled</span>
                      }
                    </div>
                    <div className="attribute-source">
                      {/* Use either isSystemGenerated or systemGenerated, whichever is available */}
                      {(attribute.isSystemGenerated !== undefined ? attribute.isSystemGenerated : attribute.systemGenerated) ? 
                        <span className="badge bg-info">System</span> : 
                        <span className="badge bg-success">User</span>
                      }
                    </div>
                    <div className="attribute-actions">
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={() => handleEditAttribute(attribute)}
                          title="Edit attribute"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDeleteAttribute(attribute.id)}
                          title="Delete attribute"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {renderPagination()}
        </div>
      </div>

      {showModal && (
        <Modal 
          isOpen={showModal}
          onClose={handleCloseModal} 
          title={editingAttribute ? 'Edit Attribute' : 'Add Attribute'}
        >
          <AttributeForm 
            attribute={editingAttribute} 
            onSubmit={handleFormSubmit} 
            onCancel={handleCloseModal}
            isLoading={formLoading}
          />
        </Modal>
      )}

      {renderFilterModal()}

      <style jsx>{`
        .attributes-grid {
          margin-top: 1rem;
        }
        
        .attribute-controls {
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
        
        .attribute-list-header {
          display: grid;
          grid-template-columns: 1fr 150px 100px 100px 100px 120px;
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
        
        .attribute-card {
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          margin-bottom: 0.75rem;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .attribute-summary {
          display: grid;
          grid-template-columns: 1fr 150px 100px 100px 100px 120px;
          padding: 0.75rem 1rem;
          align-items: center;
        }
        
        .attribute-name {
          font-weight: 500;
        }
        
        .attribute-enabled .badge,
        .attribute-source .badge {
          font-size: 0.75rem;
          padding: 0.25em 0.6em;
        }
        
        .empty-state {
          padding: 3rem 1rem;
          text-align: center;
        }
        
        .btn-group {
          display: flex;
          gap: 0.25rem;
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
      `}</style>
    </div>
  );
};

export default AttributeList;