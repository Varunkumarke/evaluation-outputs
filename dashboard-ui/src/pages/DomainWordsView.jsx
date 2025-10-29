import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Search, Copy, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DomainWordsView.css';

const DomainWordsView = ({ onEdit }) => {
  const navigate = useNavigate();
  const [allDomainWords, setAllDomainWords] = useState([]);
  const [filteredDomainWords, setFilteredDomainWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    domain_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch all domain words data when component mounts
  const fetchAllDomainWords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:8000/all-domain-words');
      
      if (!response.ok) {
        throw new Error('Failed to fetch domain words data');
      }
      
      const data = await response.json();
      setAllDomainWords(data.domain_words || []);
      setFilteredDomainWords(data.domain_words || []);
    } catch (err) {
      setError(err.message);
      setAllDomainWords([]);
      setFilteredDomainWords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDomainWords();
  }, []);

  // Filter domain words based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDomainWords(allDomainWords);
    } else {
      const filtered = allDomainWords.filter(word => 
        word.chapter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.domain_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDomainWords(filtered);
    }
  }, [searchTerm, allDomainWords]);

  // Select a domain word to view/edit
  const selectWord = (word) => {
    setSelectedWord(word);
    setEditData({
      domain_id: word.domain_id || ''
    });
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  // Check if data has changed
  const hasDataChanged = (newData, originalWord) => {
    return newData.domain_id !== originalWord.domain_id;
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Check if data has changed from original
      if (selectedWord && hasDataChanged(newData, selectedWord)) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }
      
      return newData;
    });
  };

  // Update handleSave to call onEdit only on save
  const handleSave = async () => {
    if (!editData.domain_id.trim()) {
      alert('Domain ID cannot be empty');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/domain-words/${selectedWord.chapter_id}/${selectedWord.domain_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_id: editData.domain_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update domain word');
      }

      const result = await response.json();
      alert('Domain ID updated successfully!');
      
      // Update local state
      const updatedWords = allDomainWords.map(word => 
        word.chapter_id === selectedWord.chapter_id && word.domain_id === selectedWord.domain_id
          ? { ...word, domain_id: editData.domain_id }
          : word
      );
      
      setAllDomainWords(updatedWords);
      setFilteredDomainWords(updatedWords);
      setSelectedWord({ ...selectedWord, domain_id: editData.domain_id });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Mark as edited only after successful save
      // 
      // Mark as edited only after successful save
      if (!isEdited) {
        setIsEdited(true);
        if (onEdit) {
          onEdit(`Updated domain ID to: ${editData.domain_id}`);
        }
      }
    } catch (err) {
      alert('Error updating domain ID: ' + err.message);
    }
  };

  // Delete domain word
  const handleDelete = async () => {
    if (!selectedWord) return;

    try {
      const response = await fetch(`http://localhost:8000/domain-words/${selectedWord.chapter_id}/${selectedWord.domain_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete domain word');
      }

      // Remove from local state
      const updatedWords = allDomainWords.filter(word => 
        !(word.chapter_id === selectedWord.chapter_id && word.domain_id === selectedWord.domain_id)
      );
      
      setAllDomainWords(updatedWords);
      setFilteredDomainWords(updatedWords);
      setSelectedWord(null);
      setShowDeleteConfirm(false);
      
      // Mark as edited
      // if (!isEdited) {
      //   setIsEdited(true);
      //   if (onEdit) {
      //     onEdit();
      //   }
      // }
      // Mark as edited
        if (!isEdited) {
          setIsEdited(true);
          if (onEdit) {
            onEdit(`Deleted word: ${selectedWord.name} (${selectedWord.domain_id})`);
          }
        }
      
      alert('Domain word deleted successfully!');
    } catch (err) {
      alert('Error deleting domain word: ' + err.message);
    }
  };

  // Show delete confirmation
  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Start editing
  const startEditing = () => {
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      domain_id: selectedWord.domain_id || ''
    });
    setHasUnsavedChanges(false);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(selectedWord.domain_id);
      alert('Domain ID copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  // Download as text file
  const downloadAsFile = () => {
    const blob = new Blob([selectedWord.domain_id], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedWord.domain_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="domain-words-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Domain Words Tool {isEdited && <span className="edit-indicator">(Edited)</span>}</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-group">
          <label className="search-label">
            Search Domain Words:
          </label>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Search by chapter ID, domain ID, word name, or definition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="domain-input"
            />
            <div className="search-stats">
              Showing {filteredDomainWords.length} of {allDomainWords.length} words
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
        <div className="loading">Loading all domain words data...</div>
      )}

      {/* Domain Words List and Editor */}
      {!loading && (
        <div className="content-layout">
          {/* Domain Words List */}
          <div className="words-list">
            <h3>All Domain Words ({filteredDomainWords.length})</h3>
            <div className="words-container">
              {filteredDomainWords.length === 0 ? (
                <div className="no-data">No domain words found</div>
              ) : (
                filteredDomainWords.map((word, index) => (
                  <div 
                    key={`${word.chapter_id}-${word.domain_id}`}
                    className={`word-item ${selectedWord?.chapter_id === word.chapter_id && selectedWord?.domain_id === word.domain_id ? 'active' : ''}`}
                    onClick={() => selectWord(word)}
                  >
                    <div className="word-header">
                      <div className="word-name">{word.name}</div>
                      <div className="word-id">{word.domain_id}</div>
                    </div>
                    <div className="word-details">
                      <div className="chapter-id">{word.chapter_id}</div>
                      <div className="word-preview">
                        {word.definition.substring(0, 80)}...
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Domain Word Editor */}
          <div className="editor-section">
            {selectedWord ? (
              <div className="domain-editor-container">
                <div className="editor-header">
                  <div className="editor-title">
                    <h3>Domain ID</h3>
                    <div className="word-info">
                      <span>Chapter: {selectedWord.chapter_id}</span>
                      <span>Word Name: {selectedWord.name}</span>
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
                        <button 
                          className="action-btn delete-btn"
                          onClick={confirmDelete}
                        >
                          <Trash2 size={16} />
                          Delete
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
                  <div className="word-details-grid">
                    {/* Only Domain ID Section */}
                    <div className="detail-section">
                      <h4>Domain ID</h4>
                      {isEditing ? (
                        <input
                          type="text"
                          className="definition-textarea"
                          value={editData.domain_id}
                          onChange={(e) => handleInputChange('domain_id', e.target.value)}
                          placeholder="Enter domain ID..."
                          style={{
                            padding: '1rem',
                            border: '2px solid #3b82f6',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            background: 'white',
                            color: '#374151',
                            width: '100%'
                          }}
                        />
                      ) : (
                        <div className="definition-display" style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          padding: '2rem'
                        }}>
                          {selectedWord.domain_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">
                  <Search size={48} />
                </div>
                <h3>Select a Domain Word</h3>
                <p>Click on a domain word from the list to view and edit its domain ID</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the domain word "<strong>{selectedWord?.name}</strong>" (ID: {selectedWord?.domain_id})?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="action-btn cancel-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className="action-btn delete-confirm-btn"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainWordsView;