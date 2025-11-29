import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const STATUSES = ['Needed', 'Researching', 'Ready to Purchase', 'Ordered', 'Delivered', 'Completed'];

export default function ItemModal({ item, initialRoomId, onClose }) {
    const { createItem, updateItem, rooms, createRoom, priorities } = useApp();
    const [formData, setFormData] = useState({
        name: '',
        room_id: initialRoomId || '',
        category: '',
        description: '',
        dimensions: '',
        cost: 0,
        budget_allocated: 0,
        vendor: '',
        status: 'Needed',
        priority: 'Day 1',
        delivery_date: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                room_id: item.room_id || '',
                category: item.category || '',
                description: item.description || '',
                dimensions: item.dimensions || '',
                cost: item.cost || 0,
                budget_allocated: item.budget_allocated || 0,
                vendor: item.vendor || '',
                status: item.status || 'Needed',
                priority: item.priority || 'Day 1',
                delivery_date: item.delivery_date || '',
                notes: item.notes || '',
            });
        } else if (initialRoomId) {
            setFormData(prev => ({ ...prev, room_id: initialRoomId }));
        } else if (rooms.length > 0 && !formData.room_id) {
            // Default to first room if creating new item and no room set
            setFormData(prev => ({ ...prev, room_id: rooms[0].id }));
        }
    }, [item, rooms, initialRoomId]);

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

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;
        try {
            const newRoom = await createRoom({ name: newRoomName });
            setFormData(prev => ({ ...prev, room_id: newRoom.id }));
            setNewRoomName('');
            setIsCreatingRoom(false);
        } catch (error) {
            alert('Error creating room: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (item) {
                await updateItem(item.id, formData);
            } else {
                await createItem(formData);
            }
            onClose();
        } catch (error) {
            alert('Error saving item: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{item ? 'Edit Item' : 'Add New Item'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="grid grid-2 gap-md">
                            <div className="input-group">
                                <label className="input-label">Item Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Room *</label>
                                {!isCreatingRoom ? (
                                    <div className="flex gap-sm">
                                        <select
                                            name="room_id"
                                            className="select-field"
                                            value={formData.room_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select a room</option>
                                            {rooms.map(room => (
                                                <option key={room.id} value={room.id}>{room.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setIsCreatingRoom(true)}
                                            title="Add new room"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-sm">
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="New room name"
                                            value={newRoomName}
                                            onChange={(e) => setNewRoomName(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={handleCreateRoom}
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setIsCreatingRoom(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    className="input-field"
                                    placeholder="e.g., Furniture, Décor"
                                    value={formData.category}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Vendor/Store</label>
                                <input
                                    type="text"
                                    name="vendor"
                                    className="input-field"
                                    value={formData.vendor}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Cost ($)</label>
                                <input
                                    type="number"
                                    name="cost"
                                    className="input-field"
                                    step="0.01"
                                    min="0"
                                    value={formData.cost}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Budget Allocated ($)</label>
                                <input
                                    type="number"
                                    name="budget_allocated"
                                    className="input-field"
                                    step="0.01"
                                    min="0"
                                    value={formData.budget_allocated}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Status</label>
                                <select
                                    name="status"
                                    className="select-field"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    {STATUSES.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Priority</label>
                                <select
                                    name="priority"
                                    className="select-field"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    {priorities.map(p => (
                                        <option key={p.id || p.name} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Dimensions</label>
                                <input
                                    type="text"
                                    name="dimensions"
                                    className="input-field"
                                    placeholder="e.g., 200cm x 100cm"
                                    value={formData.dimensions}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Delivery Date</label>
                                <input
                                    type="date"
                                    name="delivery_date"
                                    className="input-field"
                                    value={formData.delivery_date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                name="description"
                                className="textarea-field"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                            ></textarea>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Notes</label>
                            <textarea
                                name="notes"
                                className="textarea-field"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
