import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Search, Image as ImageIcon, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TaxonomyView.css';

const TaxonomyView = ({ onEdit }) => {
  const navigate = useNavigate();
  const [allTaxonomies, setAllTaxonomies] = useState([]);
  const [filteredTaxonomies, setFilteredTaxonomies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTaxonomy, setSelectedTaxonomy] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    domain_name: '',
    image_format: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch all taxonomies data when component mounts
  const fetchAllTaxonomies = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:8000/all-taxonomies');
      
      if (!response.ok) {
        throw new Error('Failed to fetch taxonomies data');
      }
      
      const data = await response.json();
      setAllTaxonomies(data.taxonomies || []);
      setFilteredTaxonomies(data.taxonomies || []);
    } catch (err) {
      setError(err.message);
      setAllTaxonomies([]);
      setFilteredTaxonomies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTaxonomies();
  }, []);

  // Filter taxonomies based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTaxonomies(allTaxonomies);
    } else {
      const filtered = allTaxonomies.filter(taxonomy => 
        taxonomy.chapter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        taxonomy.domain_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        taxonomy.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        taxonomy.image_format.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTaxonomies(filtered);
    }
  }, [searchTerm, allTaxonomies]);

  // Select a taxonomy to view/edit
  const selectTaxonomy = async (taxonomy) => {
    setSelectedTaxonomy(taxonomy);
    setEditData({
      domain_name: taxonomy.domain_name || '',
      image_format: taxonomy.image_format || ''
    });
    setIsEditing(false);
    setImageLoading(true);
    setHasUnsavedChanges(false);
  };

  // Check if data has changed
  const hasDataChanged = (newData, originalTaxonomy) => {
    return (
      newData.domain_name !== originalTaxonomy.domain_name ||
      newData.image_format !== originalTaxonomy.image_format
    );
  };

  // Handle input changes
  // const handleInputChange = (field, value) => {
  //   setEditData(prev => {
  //     const newData = { ...prev, [field]: value };
      
  //     // Check if data has changed from original
  //     if (selectedTaxonomy && hasDataChanged(newData, selectedTaxonomy)) {
  //       setHasUnsavedChanges(true);
  //       if (!isEdited && onEdit) {
  //         setIsEdited(true);
  //         onEdit();
  //       }
  //     } else {
  //       setHasUnsavedChanges(false);
  //     }
      
  //     return newData;
  //   });
  // };

  // // Save changes for selected taxonomy
  // const handleSave = async () => {
  //   if (!editData.domain_name.trim()) {
  //     alert('Domain name cannot be empty');
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`http://localhost:8000/taxonomy/${selectedTaxonomy.chapter_id}/${selectedTaxonomy.domain_id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(editData)
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update taxonomy');
  //     }

  //     const result = await response.json();
  //     alert('Taxonomy updated successfully!');
      
  //     // Update local state
  //     const updatedTaxonomies = allTaxonomies.map(taxonomy => 
  //       taxonomy.chapter_id === selectedTaxonomy.chapter_id && taxonomy.domain_id === selectedTaxonomy.domain_id
  //         ? { ...taxonomy, ...editData }
  //         : taxonomy
  //     );
      
  //     setAllTaxonomies(updatedTaxonomies);
  //     setFilteredTaxonomies(updatedTaxonomies);
  //     setSelectedTaxonomy({ ...selectedTaxonomy, ...editData });
  //     setIsEditing(false);
  //     setHasUnsavedChanges(false);
      
  //     // Mark as edited after successful save
  //     if (!isEdited) {
  //       setIsEdited(true);
  //       if (onEdit) {
  //         onEdit();
  //       }
  //     }
  //   } catch (err) {
  //     alert('Error updating taxonomy: ' + err.message);
  //   }
  // };
  // Handle input changes without immediately calling onEdit
const handleInputChange = (field, value) => {
  setEditData(prev => {
    const newData = { ...prev, [field]: value };
    
    // Check if data has changed from original
    if (selectedTaxonomy && hasDataChanged(newData, selectedTaxonomy)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
    
    return newData;
  });
};

// Update handleSave to call onEdit only on save
const handleSave = async () => {
  if (!editData.domain_name.trim()) {
    alert('Domain name cannot be empty');
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/taxonomy/${selectedTaxonomy.chapter_id}/${selectedTaxonomy.domain_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editData)
    });

    if (!response.ok) {
      throw new Error('Failed to update taxonomy');
    }

    const result = await response.json();
    alert('Taxonomy updated successfully!');
    
    // Update local state
    const updatedTaxonomies = allTaxonomies.map(taxonomy => 
      taxonomy.chapter_id === selectedTaxonomy.chapter_id && taxonomy.domain_id === selectedTaxonomy.domain_id
        ? { ...taxonomy, ...editData }
        : taxonomy
    );
    
    setAllTaxonomies(updatedTaxonomies);
    setFilteredTaxonomies(updatedTaxonomies);
    setSelectedTaxonomy({ ...selectedTaxonomy, ...editData });
    setIsEditing(false);
    setHasUnsavedChanges(false);
    
    // Mark as edited only after successful save
    if (!isEdited) {
      setIsEdited(true);
      if (onEdit) {
        onEdit();
      }
    }
  } catch (err) {
    alert('Error updating taxonomy: ' + err.message);
  }
};

  // Start editing
  const startEditing = () => {
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      domain_name: selectedTaxonomy.domain_name || '',
      image_format: selectedTaxonomy.image_format || ''
    });
    setHasUnsavedChanges(false);
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Handle image error
  const handleImageError = () => {
    setImageLoading(false);
    console.error('Failed to load taxonomy image');
  };

  // Download image
  const handleDownloadImage = async () => {
    if (!selectedTaxonomy) return;

    try {
      const response = await fetch(`http://localhost:8000/taxonomy/image/${selectedTaxonomy._id}`);
      if (!response.ok) throw new Error('Failed to download image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedTaxonomy.domain_id}.${selectedTaxonomy.image_format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading image: ' + err.message);
    }
  };

  return (
    <div className="taxonomy-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Taxonomy Tool {isEdited && <span className="edit-indicator">(Edited)</span>}</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-group">
          <label className="search-label">
            Search Taxonomies:
          </label>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Search by chapter ID, domain ID, domain name, or image format..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="taxonomy-input"
            />
            <div className="search-stats">
              Showing {filteredTaxonomies.length} of {allTaxonomies.length} taxonomies
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">Loading all taxonomies data...</div>
      )}

      {/* Taxonomies List and Editor */}
      {!loading && (
        <div className="content-layout">
          {/* Taxonomies List */}
          <div className="taxonomies-list">
            <h3>All Taxonomies ({filteredTaxonomies.length})</h3>
            <div className="taxonomies-container">
              {filteredTaxonomies.length === 0 ? (
                <div className="no-data">No taxonomies found</div>
              ) : (
                filteredTaxonomies.map((taxonomy, index) => (
                  <div 
                    key={`${taxonomy.chapter_id}-${taxonomy.domain_id}`}
                    className={`taxonomy-item ${selectedTaxonomy?.chapter_id === taxonomy.chapter_id && selectedTaxonomy?.domain_id === taxonomy.domain_id ? 'active' : ''}`}
                    onClick={() => selectTaxonomy(taxonomy)}
                  >
                    <div className="taxonomy-header">
                      <div className="taxonomy-name">{taxonomy.domain_name}</div>
                      <div className="taxonomy-id">{taxonomy.domain_id}</div>
                    </div>
                    <div className="taxonomy-details">
                      <div className="chapter-id">{taxonomy.chapter_id}</div>
                      <div className="image-format">
                        <ImageIcon size={14} />
                        {taxonomy.image_format.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Taxonomy Editor */}
          <div className="editor-section">
            {selectedTaxonomy ? (
              <div className="taxonomy-editor-container">
                <div className="editor-header">
                  <div className="editor-title">
                    <h3>{selectedTaxonomy.domain_name}</h3>
                    <div className="taxonomy-info">
                      <span>Domain ID: {selectedTaxonomy.domain_id}</span>
                      <span>Chapter: {selectedTaxonomy.chapter_id}</span>
                      <span>Format: {selectedTaxonomy.image_format}</span>
                      {hasUnsavedChanges && <span className="unsaved-changes">Unsaved Changes</span>}
                    </div>
                  </div>
                  <div className="editor-actions">
                    {!isEditing ? (
                      <>
                        <button 
                          className="action-btn download-btn"
                          onClick={handleDownloadImage}
                        >
                          <Download size={16} />
                          Download
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={startEditing}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="action-btn save-btn"
                          onClick={handleSave}
                          disabled={!hasUnsavedChanges}
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button 
                          className="action-btn cancel-btn"
                          onClick={cancelEditing}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="editor-content">
                  <div className="taxonomy-details-grid">
                    {/* Image Display Section */}
                    <div className="detail-section image-section">
                      <h4>
                        <ImageIcon size={16} />
                        Taxonomy Image
                      </h4>
                      <div className="image-container">
                        {imageLoading && (
                          <div className="image-loading">Loading image...</div>
                        )}
                        <img 
                          src={`http://localhost:8000/taxonomy/image/${selectedTaxonomy._id}`}
                          alt={`Taxonomy for ${selectedTaxonomy.domain_name}`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                          className="taxonomy-image"
                          style={{ display: imageLoading ? 'none' : 'block' }}
                        />
                      </div>
                    </div>

                    {/* Taxonomy Details Section */}
                    <div className="detail-section">
                      <h4>Taxonomy Details</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Domain Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.domain_name}
                              onChange={(e) => handleInputChange('domain_name', e.target.value)}
                              className="detail-input"
                              placeholder="Enter domain name..."
                            />
                          ) : (
                            <div className="detail-display">{selectedTaxonomy.domain_name}</div>
                          )}
                        </div>
                        
                        <div className="detail-item">
                          <label>Image Format</label>
                          {isEditing ? (
                            <select
                              value={editData.image_format}
                              onChange={(e) => handleInputChange('image_format', e.target.value)}
                              className="detail-select"
                            >
                              <option value="svg">SVG</option>
                              <option value="png">PNG</option>
                              <option value="jpg">JPG</option>
                              <option value="jpeg">JPEG</option>
                            </select>
                          ) : (
                            <div className="detail-display">{selectedTaxonomy.image_format.toUpperCase()}</div>
                          )}
                        </div>

                        <div className="detail-item">
                          <label>Domain ID</label>
                          <div className="detail-display muted">{selectedTaxonomy.domain_id}</div>
                        </div>

                        <div className="detail-item">
                          <label>Chapter ID</label>
                          <div className="detail-display muted">{selectedTaxonomy.chapter_id}</div>
                        </div>

                        <div className="detail-item full-width">
                          <label>Image URL</label>
                          <div className="url-display">
                            {`http://localhost:8000/taxonomy/image/${selectedTaxonomy._id}`}
                            <button 
                              className="copy-url-btn"
                              onClick={() => navigator.clipboard.writeText(`http://localhost:8000/taxonomy/image/${selectedTaxonomy._id}`)}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">
                  <Search size={48} />
                </div>
                <h3>Select a Taxonomy</h3>
                <p>Click on a taxonomy from the list to view and edit its details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxonomyView;