import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Search } from 'lucide-react';
import './WordStructureView.css';

const WordStructureView = ({ onEdit }) => {
  const navigate = useNavigate();
  const [allDomainWords, setAllDomainWords] = useState([]);
  const [filteredDomainWords, setFilteredDomainWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    word_structure: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch all domain words data
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
        word.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDomainWords(filtered);
    }
  }, [searchTerm, allDomainWords]);

  // Select a domain word to view/edit
  const selectWord = (word) => {
    setSelectedWord(word);
    setEditData({
      word_structure: word.word_structure || {}
    });
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:8000/domain-words/${selectedWord.chapter_id}/${selectedWord.domain_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word_structure: editData.word_structure
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update word structure');
      }

      // Update local state
      const updatedWords = allDomainWords.map(word => 
        word.chapter_id === selectedWord.chapter_id && word.domain_id === selectedWord.domain_id
          ? { 
              ...word, 
              word_structure: editData.word_structure
            }
          : word
      );
      
      setAllDomainWords(updatedWords);
      setFilteredDomainWords(updatedWords);
      setSelectedWord({ 
        ...selectedWord, 
        word_structure: editData.word_structure
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Mark as edited
      if (!isEdited) {
        setIsEdited(true);
        if (onEdit) {
          onEdit(`Updated word structure for: ${selectedWord.name}`);
        }
      }
      
      alert('Word structure updated successfully!');
    } catch (err) {
      alert('Error updating word structure: ' + err.message);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      word_structure: selectedWord.word_structure || {}
    });
    setHasUnsavedChanges(false);
  };

  const handleStructureChange = (key, value) => {
    setEditData(prev => ({
      ...prev,
      word_structure: {
        ...prev.word_structure,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const addNewField = () => {
    const fieldName = prompt('Enter new field name:');
    if (fieldName && fieldName.trim()) {
      handleStructureChange(fieldName.trim(), '');
    }
  };

  const removeField = (key) => {
    const newStructure = { ...editData.word_structure };
    delete newStructure[key];
    setEditData(prev => ({
      ...prev,
      word_structure: newStructure
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="word-structure-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Word Structure Tool {isEdited && <span className="edit-indicator">(Edited)</span>}</h1>
        <p>View and edit word structure patterns</p>
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
              placeholder="Search by chapter ID, domain ID, or word name..."
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

      {loading && (
        <div className="loading">Loading domain words data...</div>
      )}

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
                      <div className="structure-preview">
                        {Object.keys(word.word_structure || {}).length > 0 
                          ? `${Object.keys(word.word_structure || {}).length} structure fields`
                          : 'No structure data'
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Word Structure Editor */}
          <div className="editor-section">
            {selectedWord ? (
              <div className="structure-editor-container">
                <div className="editor-header">
                  <div className="editor-title">
                    <h3>Word Structure</h3>
                    <div className="word-info">
                      <span>Chapter: {selectedWord.chapter_id}</span>
                      <span>Domain ID: {selectedWord.domain_id}</span>
                      <span>Word: {selectedWord.name}</span>
                      {hasUnsavedChanges && <span className="unsaved-changes">Unsaved Changes</span>}
                    </div>
                  </div>
                  <div className="editor-actions">
                    {!isEditing ? (
                      <button 
                        className="action-btn edit-btn"
                        onClick={startEditing}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
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
                  <div className="structure-section">
                    <div className="section-header">
                      <h4>Word Structure Details</h4>
                      {isEditing && (
                        <button 
                          className="add-field-btn"
                          onClick={addNewField}
                        >
                          + Add Field
                        </button>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="structure-edit">
                        {Object.entries(editData.word_structure).map(([key, value]) => (
                          <div key={key} className="structure-field-edit">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => {
                                const newStructure = { ...editData.word_structure };
                                const oldValue = newStructure[key];
                                delete newStructure[key];
                                newStructure[e.target.value] = oldValue;
                                setEditData(prev => ({...prev, word_structure: newStructure}));
                                setHasUnsavedChanges(true);
                              }}
                              className="field-name-input"
                              placeholder="Field name"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleStructureChange(key, e.target.value)}
                              className="field-value-input"
                              placeholder="Field value"
                            />
                            <button 
                              className="remove-field-btn"
                              onClick={() => removeField(key)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {Object.keys(editData.word_structure).length === 0 && (
                          <div className="no-fields">
                            No structure fields defined. Click "Add Field" to start.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="structure-display">
                        {Object.entries(selectedWord.word_structure || {}).length > 0 ? (
                          Object.entries(selectedWord.word_structure).map(([key, value]) => (
                            <div key={key} className="structure-field">
                              <strong>{key}:</strong> 
                              <span>{value}</span>
                            </div>
                          ))
                        ) : (
                          <div className="no-structure">
                            No word structure data available for this word.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">
                  <Search size={48} />
                </div>
                <h3>Select a Domain Word</h3>
                <p>Click on a domain word from the list to view and edit its word structure</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordStructureView;