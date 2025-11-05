import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext'; // ✅ Toast import
import './DomainWordsView.css';


const DomainWordsView = ({ onEdit }) => {
  const navigate = useNavigate();
  const { success, error } = useToast(); // ✅ Toast hook
  const [allDomainWords, setAllDomainWords] = useState([]);
  const [filteredDomainWords, setFilteredDomainWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [componentError, setComponentError] = useState(''); // ✅ Renamed to avoid conflict
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch all domain words data when component mounts
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
      error('Failed to load domain words: ' + err.message); // ✅ Toast for fetch error
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

  // Start editing a domain word
  const startEditing = (word) => {
    setEditingId(`${word.chapter_id}-${word.domain_id}`);
    setEditData({
      domain_id: word.domain_id || ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save domain word - UPDATED WITH TOASTS ✅
  const handleSave = async (word) => {
    if (!editData.domain_id.trim()) {
      error('Domain ID cannot be empty'); // ✅ Toast instead of alert
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/domain-words/${word.chapter_id}/${word.domain_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_id: editData.domain_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update domain word');
      }

      // Update local state
      const updatedWords = allDomainWords.map(w => 
        w.chapter_id === word.chapter_id && w.domain_id === word.domain_id
          ? { ...w, domain_id: editData.domain_id }
          : w
      );
      
      setAllDomainWords(updatedWords);
      setFilteredDomainWords(updatedWords);
      setEditingId(null);
      setEditData({});
      
      // Mark as edited
      if (!isEdited) {
        setIsEdited(true);
        if (onEdit) {
          onEdit(`Updated domain ID to: ${editData.domain_id}`);
        }
      }
      
      success('Domain word updated successfully!'); // ✅ Toast instead of alert
    } catch (err) {
      error('Error updating domain word: ' + err.message); // ✅ Toast instead of alert
    }
  };

  // Delete domain word - UPDATED WITH TOASTS ✅
  const handleDelete = async (word) => {
    try {
      const response = await fetch(`http://localhost:8000/domain-words/${word.chapter_id}/${word.domain_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete domain word');
      }

      // Remove from local state
      const updatedWords = allDomainWords.filter(w => 
        !(w.chapter_id === word.chapter_id && w.domain_id === word.domain_id)
      );
      
      setAllDomainWords(updatedWords);
      setFilteredDomainWords(updatedWords);
      setShowDeleteConfirm(null);
      
      // Mark as edited
      if (!isEdited) {
        setIsEdited(true);
        if (onEdit) {
          onEdit(`Deleted word: ${word.name} (${word.domain_id})`);
        }
      }
      
      success('Domain word deleted successfully!'); // ✅ Toast instead of alert
    } catch (err) {
      error('Error deleting domain word: ' + err.message); // ✅ Toast instead of alert
    }
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

      {componentError && ( // ✅ Updated variable name
        <div className="error-message">
          {componentError}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">Loading all domain words data...</div>
      )}

      {/* Domain Words Table */}
      {!loading && (
        <div className="words-table-container">
          {filteredDomainWords.length === 0 ? (
            <div className="no-data">
              <Search size={48} />
              <h3>No Domain Words Found</h3>
              <p>No domain words match your search criteria</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="words-table">
                <thead>
                  <tr>
                    <th>Word Name</th>
                    <th>Domain ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDomainWords.map((word) => {
                    const wordId = `${word.chapter_id}-${word.domain_id}`;
                    const isEditing = editingId === wordId;
                    
                    return (
                      <tr key={wordId} className={isEditing ? 'editing-row' : ''}>
                        {/* Word Name - Clean version without chapter ID and definition */}
                        <td className="word-name-cell">
                          <div className="word-name">{word.name}</div>
                        </td>
                        
                        {/* Domain ID - Editable */}
                        <td className="domain-id-cell">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.domain_id}
                              onChange={(e) => setEditData({ domain_id: e.target.value })}
                              className="domain-id-input"
                              placeholder="Enter domain ID..."
                            />
                          ) : (
                            <div className="domain-id-display">{word.domain_id}</div>
                          )}
                        </td>
                        
                        {/* Actions - Removed Copy and Download buttons */}
                        <td className="actions-cell">
                          {isEditing ? (
                            <div className="edit-actions">
                              <button 
                                className="action-btn save-btn"
                                onClick={() => handleSave(word)}
                                disabled={!editData.domain_id.trim()}
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
                            </div>
                          ) : (
                            <div className="view-actions">
                              <button 
                                className="action-btn edit-btn"
                                onClick={() => startEditing(word)}
                              >
                                <Edit size={16} />
                                Edit
                              </button>
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => setShowDeleteConfirm(word)}
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
              <p>Are you sure you want to delete the domain word "<strong>{showDeleteConfirm.name}</strong>" (ID: {showDeleteConfirm.domain_id})?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="action-btn cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="action-btn delete-confirm-btn"
                onClick={() => handleDelete(showDeleteConfirm)}
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

