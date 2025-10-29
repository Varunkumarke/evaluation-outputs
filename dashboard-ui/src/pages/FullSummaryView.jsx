import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Save, X, Search, Copy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FullSummaryView.css';

const FullSummaryView = ({ onEdit }) => {
  const navigate = useNavigate();
  const [allChapters, setAllChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch all chapters data when component mounts
  const fetchAllChapters = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:8000/all-chapters');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chapters data');
      }
      
      const data = await response.json();
      setAllChapters(data.chapters || []);
      setFilteredChapters(data.chapters || []);
    } catch (err) {
      setError(err.message);
      setAllChapters([]);
      setFilteredChapters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllChapters();
  }, []);

  // Filter chapters based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChapters(allChapters);
    } else {
      const filtered = allChapters.filter(chapter => 
        chapter.chapter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.full_summary.some(sentence => 
          sentence.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredChapters(filtered);
    }
  }, [searchTerm, allChapters]);

  // Select a chapter to view/edit
  const selectChapter = (chapter) => {
    setSelectedChapter(chapter);
    setEditText(chapter.full_summary.join('\n\n'));
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  // // Handle text changes during editing
  // const handleTextChange = (newText) => {
  //   setEditText(newText);
    
  //   // Check if text has actually changed from original
  //   const originalText = selectedChapter.full_summary.join('\n\n');
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
  

  // Save all changes for selected chapter
  // const handleSaveAll = async () => {
  //   if (!editText.trim()) {
  //     alert('Text cannot be empty');
  //     return;
  //   }

  //   try {
  //     const newSentences = editText.split('\n\n').filter(sentence => sentence.trim());
      
  //     const response = await fetch(`http://localhost:8000/full-summary/replace/${selectedChapter.chapter_id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         sentences: newSentences
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update summary');
  //     }

  //     const result = await response.json();
  //     alert('Summary updated successfully!');
      
  //     // Update local state
  //     const updatedChapters = allChapters.map(chapter => 
  //       chapter.chapter_id === selectedChapter.chapter_id 
  //         ? { ...chapter, full_summary: newSentences }
  //         : chapter
  //     );
      
  //     setAllChapters(updatedChapters);
  //     setFilteredChapters(updatedChapters);
  //     setSelectedChapter({ ...selectedChapter, full_summary: newSentences });
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
  //     alert('Error updating summary: ' + err.message);
  //   }
  // };
  // Handle text changes during editing
const handleTextChange = (newText) => {
  setEditText(newText);
  
  // Check if text has actually changed from original
  const originalText = selectedChapter.full_summary.join('\n\n');
  if (newText !== originalText) {
    setHasUnsavedChanges(true);
  } else {
    setHasUnsavedChanges(false);
  }
};

// Separate function to handle edit marking (call this only on save)
const handleSaveAll = async () => {
  if (!editText.trim()) {
    alert('Text cannot be empty');
    return;
  }

  try {
    const newSentences = editText.split('\n\n').filter(sentence => sentence.trim());
    
    const response = await fetch(`http://localhost:8000/full-summary/replace/${selectedChapter.chapter_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentences: newSentences
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update summary');
    }

    const result = await response.json();
    alert('Summary updated successfully!');
    
    // Update local state
    const updatedChapters = allChapters.map(chapter => 
      chapter.chapter_id === selectedChapter.chapter_id 
        ? { ...chapter, full_summary: newSentences }
        : chapter
    );
    
    setAllChapters(updatedChapters);
    setFilteredChapters(updatedChapters);
    setSelectedChapter({ ...selectedChapter, full_summary: newSentences });
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
    alert('Error updating summary: ' + err.message);
  }
};

  // Start editing
  const startEditing = () => {
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditText(selectedChapter.full_summary.join('\n\n'));
    setHasUnsavedChanges(false);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editText);
      alert('Summary copied to clipboard!');
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
    a.download = `${selectedChapter.chapter_id}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Count words and characters
  const wordCount = editText.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = editText.length;
  const sentenceCount = editText.split('\n\n').filter(sentence => sentence.trim()).length;

  return (
    <div className="full-summary-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Full Summary Tool {isEdited && <span className="edit-indicator">(Edited)</span>}</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-group">
          <label className="search-label">
            Search Chapters:
          </label>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Search by chapter ID or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chapter-input"
            />
            <div className="search-stats">
              Showing {filteredChapters.length} of {allChapters.length} chapters
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
        <div className="loading">Loading all chapters data...</div>
      )}

      {/* Chapters List and Editor */}
      {!loading && (
        <div className="content-layout">
          {/* Chapters List */}
          <div className="chapters-list">
            <h3>All Chapters ({filteredChapters.length})</h3>
            <div className="chapters-container">
              {filteredChapters.length === 0 ? (
                <div className="no-data">No chapters found</div>
              ) : (
                filteredChapters.map((chapter, index) => (
                  <div 
                    key={chapter.chapter_id}
                    className={`chapter-item ${selectedChapter?.chapter_id === chapter.chapter_id ? 'active' : ''}`}
                    onClick={() => selectChapter(chapter)}
                  >
                    <div className="chapter-id">{chapter.chapter_id}</div>
                    <div className="chapter-sentences">
                      {chapter.full_summary.length} sentences
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chapter Editor */}
          <div className="editor-section">
            {selectedChapter ? (
              <div className="summary-editor-container">
                <div className="editor-header">
                  <div className="editor-title">
                    <h3>Chapter: {selectedChapter.chapter_id}</h3>
                    <div className="summary-stats">
                      <span>{sentenceCount} sentences</span>
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
                          Save All
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
                      placeholder="Enter your chapter summary here. Separate sentences with blank lines."
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
                      <li>Separate sentences with blank lines (press Enter twice)</li>
                      <li>Each paragraph will be treated as a separate sentence</li>
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
                <h3>Select a Chapter</h3>
                <p>Click on a chapter from the list to view and edit its summary</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullSummaryView;