import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function RoomModal({ room, onClose }) {
    const { createRoom, updateRoom } = useApp();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        budget: 0
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (room) {
            setFormData({
                name: room.name || '',
                description: room.description || '',
                budget: room.budget || 0
            });
        }
    }, [room]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (room) {
                await updateRoom(room.id, formData);
            } else {
                await createRoom(formData);
            }
            onClose();
        } catch (error) {
            alert('Error saving room: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{room ? 'Edit Room' : 'Add New Room'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="input-group">
                            <label className="input-label">Room Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Budget Allocation ($)</label>
                            <input
                                type="number"
                                name="budget"
                                className="input-field"
                                min="0"
                                step="0.01"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                            <p className="text-muted text-sm mt-xs">Optional: Set a budget limit for this room</p>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                name="description"
                                className="textarea-field"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : (room ? 'Update Room' : 'Create Room')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
