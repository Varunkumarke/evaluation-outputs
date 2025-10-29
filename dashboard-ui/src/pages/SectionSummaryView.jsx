import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Search, Copy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SectionSummaryView.css';

const SectionSummaryView = ({ onEdit }) => {
  const navigate = useNavigate();
  const [allSections, setAllSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch all sections data when component mounts
  const fetchAllSections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:8000/all-sections');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sections data');
      }
      
      const data = await response.json();
      setAllSections(data.sections || []);
      setFilteredSections(data.sections || []);
    } catch (err) {
      setError(err.message);
      setAllSections([]);
      setFilteredSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSections();
  }, []);

  // Filter sections based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSections(allSections);
    } else {
      const filtered = allSections.filter(section => 
        section.chapter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.section_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.section_summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSections(filtered);
    }
  }, [searchTerm, allSections]);

  // Select a section to view/edit
  const selectSection = (section) => {
    setSelectedSection(section);
    setEditText(section.section_summary);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  // Handle text changes during editing
  // const handleTextChange = (newText) => {
  //   setEditText(newText);
    
  //   // Check if text has actually changed from original
  //   const originalText = selectedSection.section_summary;
  //   if (newText !== originalText) {
  //     setHasUnsavedChanges(true);
      
  //     // Mark as edited when user makes changes (even before saving)
  //     if (!isEdited) {
  //       setIsEdited(true);
  //       if (onEdit) {
  //         onEdit();
  //       }
  //     }
  //   } else {
  //     setHasUnsavedChanges(false);
  //   }
  // };

  // // Save all changes for selected section
  // const handleSaveAll = async () => {
  //   if (!editText.trim()) {
  //     alert('Text cannot be empty');
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`http://localhost:8000/section-summary/replace/${selectedSection.chapter_id}/${selectedSection.section_id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         section_summary: editText
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update section summary');
  //     }

  //     const result = await response.json();
  //     alert('Section summary updated successfully!');
      
  //     // Update local state
  //     const updatedSections = allSections.map(section => 
  //       section.chapter_id === selectedSection.chapter_id && section.section_id === selectedSection.section_id
  //         ? { ...section, section_summary: editText }
  //         : section
  //     );
      
  //     setAllSections(updatedSections);
  //     setFilteredSections(updatedSections);
  //     setSelectedSection({ ...selectedSection, section_summary: editText });
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
  //     alert('Error updating section summary: ' + err.message);
  //   }
  // };
  // Handle text changes during editing
const handleTextChange = (newText) => {
  setEditText(newText);
  
  // Check if text has actually changed from original
  const originalText = selectedSection.section_summary;
  if (newText !== originalText) {
    setHasUnsavedChanges(true);
  } else {
    setHasUnsavedChanges(false);
  }
};

// Update handleSaveAll to call onEdit only on save
const handleSaveAll = async () => {
  if (!editText.trim()) {
    alert('Text cannot be empty');
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/section-summary/replace/${selectedSection.chapter_id}/${selectedSection.section_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section_summary: editText
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update section summary');
    }

    const result = await response.json();
    alert('Section summary updated successfully!');
    
    // Update local state
    const updatedSections = allSections.map(section => 
      section.chapter_id === selectedSection.chapter_id && section.section_id === selectedSection.section_id
        ? { ...section, section_summary: editText }
        : section
    );
    
    setAllSections(updatedSections);
    setFilteredSections(updatedSections);
    setSelectedSection({ ...selectedSection, section_summary: editText });
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
    alert('Error updating section summary: ' + err.message);
  }
};

  // Start editing
  const startEditing = () => {
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditText(selectedSection.section_summary);
    setHasUnsavedChanges(false);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editText);
      alert('Section summary copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  // Download as text file
  const downloadAsFile = () => {
    const blob = new Blob([editText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSection.chapter_id}_${selectedSection.section_id}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Count words and characters
  const wordCount = editText.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = editText.length;

  return (
    <div className="section-summary-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Section Summary Tool {isEdited && <span className="edit-indicator">(Edited)</span>}</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-group">
          <label className="search-label">
            Search Sections:
          </label>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Search by chapter ID, section ID, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="section-input"
            />
            <div className="search-stats">
              Showing {filteredSections.length} of {allSections.length} sections
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
        <div className="loading">Loading all sections data...</div>
      )}

      {/* Sections List and Editor */}
      {!loading && (
        <div className="content-layout">
          {/* Sections List */}
          <div className="sections-list">
            <h3>All Sections ({filteredSections.length})</h3>
            <div className="sections-container">
              {filteredSections.length === 0 ? (
                <div className="no-data">No sections found</div>
              ) : (
                filteredSections.map((section, index) => (
                  <div 
                    key={`${section.chapter_id}-${section.section_id}`}
                    className={`section-item ${selectedSection?.chapter_id === section.chapter_id && selectedSection?.section_id === section.section_id ? 'active' : ''}`}
                    onClick={() => selectSection(section)}
                  >
                    <div className="section-header">
                      <div className="section-id">Section {section.section_id}</div>
                      <div className="chapter-id">{section.chapter_id}</div>
                    </div>
                    <div className="section-preview">
                      {section.section_summary.substring(0, 100)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section Editor */}
          <div className="editor-section">
            {selectedSection ? (
              <div className="summary-editor-container">
                <div className="editor-header">
                  <div className="editor-title">
                    <h3>Section {selectedSection.section_id}</h3>
                    <div className="section-info">
                      Chapter: {selectedSection.chapter_id}
                    </div>
                    <div className="summary-stats">
                      <span>{wordCount} words</span>
                      <span>{charCount} characters</span>
                      {hasUnsavedChanges && <span className="unsaved-changes">Unsaved Changes</span>}
                    </div>
                  </div>
                  <div className="editor-actions">
                    {!isEditing ? (
                      <>
                        <button 
                          className="action-btn copy-btn"
                          onClick={copyToClipboard}
                        >
                          <Copy size={16} />
                          Copy
                        </button>
                        <button 
                          className="action-btn download-btn"
                          onClick={downloadAsFile}
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
                          onClick={handleSaveAll}
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
                  {isEditing ? (
                    <textarea
                      className="summary-textarea"
                      value={editText}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder="Enter your section summary here..."
                      spellCheck="true"
                    />
                  ) : (
                    <div className="summary-display">
                      {editText}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="editor-help">
                    {/* <h4>Editing Tips:</h4>
                    <ul>
                      <li>You can edit the entire section summary in this text area</li>
                      <li>Use line breaks to separate paragraphs</li>
                      <li>You can copy-paste content from other documents</li>
                    </ul> */}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">
                  <Search size={48} />
                </div>
                <h3>Select a Section</h3>
                <p>Click on a section from the list to view and edit its summary</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionSummaryView;