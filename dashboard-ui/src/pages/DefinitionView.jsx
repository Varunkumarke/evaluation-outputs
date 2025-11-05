import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext'; // ✅ ADD THIS IMPORT
import './DefinitionView.css';

const DefinitionView = ({ onEdit }) => {
  const navigate = useNavigate();
  const { success, error } = useToast(); // ✅ ADD THIS LINE
  const [allDomainWords, setAllDomainWords] = useState([]);
  const [filteredDomainWords, setFilteredDomainWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [componentError, setComponentError] = useState(''); // ✅ RENAMED to avoid conflict
  const [selectedWord, setSelectedWord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    definition: '',
    translations: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch all domain words data
  const fetchAllDomainWords = async () => {
    try {
      setLoading(true);
      setComponentError('');
      const response = await fetch('http://localhost:8000/all-domain-words');
      
      if (!response.ok) {
        throw new Error('Failed to fetch domain words data');
      }
      
      const data = await response.json();
      setAllDomainWords(data.domain_words || []);
      setFilteredDomainWords(data.domain_words || []);
    } catch (err) {
      setComponentError(err.message);
      error('Failed to load domain words: ' + err.message); // ✅ TOAST FOR FETCH ERROR
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
      definition: word.definition || '',
      translations: word.translations || {}
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
          definition: editData.definition,
          translations: editData.translations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update domain word definition');
      }

      // Update local state
      const updatedWords = allDomainWords.map(word => 
        word.chapter_id === selectedWord.chapter_id && word.domain_id === selectedWord.domain_id
          ? { 
              ...word, 
              definition: editData.definition,
              translations: editData.translations
            }
          : word
      );
      
      setAllDomainWords(updatedWords);
      setFilteredDomainWords(updatedWords);
      setSelectedWord({ 
        ...selectedWord, 
        definition: editData.definition,
        translations: editData.translations
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Mark as edited
      if (!isEdited) {
        setIsEdited(true);
        if (onEdit) {
          onEdit(`Updated definition and translations for: ${selectedWord.name}`);
        }
      }
      
      success('Definition and translations updated successfully!'); // ✅ TOAST INSTEAD OF ALERT
    } catch (err) {
      error('Error updating definition: ' + err.message); // ✅ TOAST INSTEAD OF ALERT
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      definition: selectedWord.definition || '',
      translations: selectedWord.translations || {}
    });
    setHasUnsavedChanges(false);
  };

  return (
    <div className="definition-view-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Definition Tool {isEdited && <span className="edit-indicator">(Edited)</span>}</h1>
        <p>View and edit definitions and translations</p>
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

      {componentError && ( // ✅ UPDATED VARIABLE NAME
        <div className="error-message">
          {componentError}
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
                      <div className="word-preview">
                        {word.definition.substring(0, 80)}...
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Definition Editor */}
          <div className="editor-section">
            {selectedWord ? (
              <div className="definition-editor-container">
                <div className="editor-header">
                  <div className="editor-title">
                    <h3>Definition Details</h3>
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
                  {/* Definition Section */}
                  <div className="detail-section">
                    <h4>Definition</h4>
                    {isEditing ? (
                      <textarea
                        value={editData.definition}
                        onChange={(e) => {
                          setEditData(prev => ({...prev, definition: e.target.value}));
                          setHasUnsavedChanges(true);
                        }}
                        className="definition-textarea"
                        rows="4"
                        placeholder="Enter definition..."
                      />
                    ) : (
                      <div className="definition-display">
                        {selectedWord.definition}
                      </div>
                    )}
                  </div>

                  {/* Translations Section */}
                  <div className="detail-section">
                    <h4>Translations</h4>
                    {isEditing ? (
                      <div className="translations-edit">
                        {Object.entries(editData.translations).map(([lang, translation]) => (
                          <div key={lang} className="translation-edit-item">
                            <label>{lang.toUpperCase()}:</label>
                            <input
                              type="text"
                              value={translation}
                              onChange={(e) => {
                                const newTranslations = {...editData.translations};
                                newTranslations[lang] = e.target.value;
                                setEditData(prev => ({...prev, translations: newTranslations}));
                                setHasUnsavedChanges(true);
                              }}
                              className="translation-input"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="translations-display">
                        {Object.entries(selectedWord.translations || {}).map(([lang, translation]) => (
                          <div key={lang} className="translation-item">
                            <strong>{lang.toUpperCase()}:</strong> 
                            <span>{translation}</span>
                          </div>
                        ))}
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
                <p>Click on a domain word from the list to view and edit its definition and translations</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DefinitionView;