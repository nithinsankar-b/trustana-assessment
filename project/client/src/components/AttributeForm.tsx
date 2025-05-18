import React, { useState, useEffect } from 'react';

const AttributeForm = ({
  attribute,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'SHORT_TEXT',
    unit: '',
    options: [],
    isRequired: false
  });
  
  const [optionInput, setOptionInput] = useState('');

  // Initialize form with attribute data if editing
  useEffect(() => {
    if (attribute) {
      setFormData({ ...attribute });
    }
  }, [attribute]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        options: [...(prev.options || []), optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group mb-3">
        <label className="form-label">Attribute Name</label>
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
        <label className="form-label">Type</label>
        <select
          name="type"
          value={formData.type || 'SHORT_TEXT'}
          onChange={handleChange}
          required
          className="form-control"
        >
          <option value="SHORT_TEXT">Short Text</option>
          <option value="LONG_TEXT">Long Text</option>
          <option value="RICH_TEXT">Rich Text</option>
          <option value="NUMBER">Number</option>
          <option value="SINGLE_SELECT">Single Select</option>
          <option value="MULTIPLE_SELECT">Multiple Select</option>
          <option value="MEASURE">Measure</option>
        </select>
      </div>

      {/* Unit field - always visible but especially important for MEASURE type */}
      <div className="form-group mb-3">
        <label className="form-label">Unit</label>
        <input
          type="text"
          name="unit"
          value={formData.unit || ''}
          onChange={handleChange}
          placeholder="e.g., cm, kg, USD"
          className="form-control"
        />
        <small className="form-text text-muted">
          {formData.type === 'MEASURE' ? 'Required for measurement attributes' : 'Optional for this attribute type'}
        </small>
      </div>

      {(formData.type === 'SINGLE_SELECT' || formData.type === 'MULTIPLE_SELECT') && (
        <div className="form-group mb-3">
          <label className="form-label">Options</label>
          <div className="input-group">
            <input
              type="text"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              placeholder="Option value"
              className="form-control"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
          
          {formData.options && formData.options.length > 0 ? (
            <div className="mt-2 p-2 border rounded">
              <div className="mb-2 fw-bold">Added options:</div>
              {formData.options.map((option, index) => (
                <div key={index} className="d-flex align-items-center mb-2 p-1 bg-light rounded">
                  <span className="me-auto">{option}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn btn-sm btn-outline-danger ms-2"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-muted">
              No options added yet. Add at least one option for select fields.
            </div>
          )}
        </div>
      )}

      <div className="form-group mb-3">
        <div className="form-check">
          <input
            type="checkbox"
            name="isRequired"
            id="isRequired"
            checked={formData.isRequired || false}
            onChange={handleChange}
            className="form-check-input"
          />
          <label htmlFor="isRequired" className="form-check-label">
            Enabled
          </label>
          <small className="d-block text-muted mt-1">
            When enabled, this attribute will be used for AI Enrichment
          </small>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Saving...' : attribute ? 'Update Attribute' : 'Create Attribute'}
        </button>
      </div>
    </form>
  );
};

export default AttributeForm;