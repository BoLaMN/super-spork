import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ItemModal from './ItemModal';
import './ItemManager.css';

const STATUSES = ['Needed', 'Researching', 'Ready to Purchase', 'Ordered', 'Delivered', 'Completed'];

export default function ItemManager() {
    const { items, deleteItem, rooms, updateItem, priorities } = useApp();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRoomId, setFilterRoomId] = useState(searchParams.get('room_id') || '');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [viewMode, setViewMode] = useState('vendor'); // 'list', 'grouped', or 'vendor'
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Update URL when filter changes
    useEffect(() => {
        if (filterRoomId) {
            setSearchParams({ room_id: filterRoomId });
        } else {
            setSearchParams({});
        }
    }, [filterRoomId, setSearchParams]);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = items.filter(item => {
            const matchesSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.vendor?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRoom = !filterRoomId || item.room_id === parseInt(filterRoomId);
            const matchesStatus = !filterStatus || item.status === filterStatus;
            const matchesPriority = !filterPriority || item.priority === filterPriority;

            return matchesSearch && matchesRoom && matchesStatus && matchesPriority;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'cost') return (b.cost || 0) - (a.cost || 0);
            if (sortBy === 'delivery_date') {
                if (!a.delivery_date) return 1;
                if (!b.delivery_date) return -1;
                return new Date(a.delivery_date) - new Date(b.delivery_date);
            }
            if (sortBy === 'priority') {
                const getSortOrder = (priorityName) => {
                    const p = priorities.find(p => p.name === priorityName);
                    return p ? p.sort_order : 999;
                };
                return getSortOrder(a.priority) - getSortOrder(b.priority);
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });

        return result;
    }, [items, searchTerm, filterRoomId, filterStatus, filterPriority, sortBy, priorities]);

    const groupedItems = useMemo(() => {
        if (viewMode === 'grouped') {
            const groups = {};
            rooms.forEach(room => {
                groups[room.name] = filteredItems.filter(item => item.room_id === room.id);
            });
            // Add items with no room or unknown room
            const unknownItems = filteredItems.filter(item => !item.room_id || !rooms.find(r => r.id === item.room_id));
            if (unknownItems.length > 0) {
                groups['Unassigned'] = unknownItems;
            }
            return groups;
        } else if (viewMode === 'vendor') {
            const groups = {};
            filteredItems.forEach(item => {
                const vendor = item.vendor || 'No Vendor';
                if (!groups[vendor]) {
                    groups[vendor] = [];
                }
                groups[vendor].push(item);
            });
            return groups;
        }
        return {};
    }, [filteredItems, rooms, viewMode]);

    const handleToggleStatus = async (item) => {
        const newStatus = item.status === 'Completed' ? 'Needed' : 'Completed';
        try {
            await updateItem(item.id, { ...item, status: newStatus });
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await deleteItem(id);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingItem(null);
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'Completed') return 'badge-success';
        if (status === 'Delivered' || status === 'Ordered') return 'badge-info';
        if (status === 'Ready to Purchase') return 'badge-warning';
        return 'badge-purple';
    };

    const getPriorityBadgeClass = (priority) => {
        if (priority === 'Day 1') return 'badge-danger';
        if (priority === 'Week 1') return 'badge-warning';
        if (priority === 'Week 2') return 'badge-info';
        return 'badge-purple';
    };

    const renderItemCard = (item) => (
        <div key={item.id} className={`item-card glass-card ${item.status === 'Completed' ? 'item-completed' : ''}`}>
            <div className="item-header">
                <button 
                    className={`status-toggle-btn ${item.status === 'Completed' ? 'checked' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(item);
                    }}
                    title={item.status === 'Completed' ? "Mark as Needed" : "Mark as Completed"}
                >
                    {item.status === 'Completed' ? '✓' : ''}
                </button>
                <h3 className="item-title">{item.name}</h3>
                <div className="item-badges">
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                    </span>
                    <span className={`badge ${getPriorityBadgeClass(item.priority)}`}>
                        {item.priority}
                    </span>
                </div>
            </div>

            <div className="item-details">
                <div className="item-detail-row">
                    <span className="detail-label">🏠 Room:</span>
                    <span>{item.room}</span>
                </div>
                {item.category && (
                    <div className="item-detail-row">
                        <span className="detail-label">📂 Category:</span>
                        <span>{item.category}</span>
                    </div>
                )}
                {item.cost > 0 && (
                    <div className="item-detail-row">
                        <span className="detail-label">💰 Cost:</span>
                        <span className="cost-value">${item.cost.toFixed(2)}</span>
                    </div>
                )}
                {item.vendor && (
                    <div className="item-detail-row">
                        <span className="detail-label">🏪 Vendor:</span>
                        <span>{item.vendor}</span>
                    </div>
                )}
                {item.delivery_date && (
                    <div className="item-detail-row">
                        <span className="detail-label">📅 Delivery:</span>
                        <span>{item.delivery_date}</span>
                    </div>
                )}
                {item.description && (
                    <div className="item-description">
                        <p>{item.description}</p>
                    </div>
                )}
            </div>

            <div className="item-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(item)}>
                    ✏️ Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                    🗑️ Delete
                </button>
            </div>
        </div>
    );

    return (
        <div className="container item-manager">
            <header className="page-header">
                <div>
                    <h1>Furnishing Items</h1>
                    <p className="text-muted">Manage all your home furnishing items</p>
                </div>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button 
                            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </button>
                        <button 
                            className={`btn ${viewMode === 'grouped' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('grouped')}
                        >
                            By Room
                        </button>
                        <button 
                            className={`btn ${viewMode === 'vendor' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('vendor')}
                        >
                            By Vendor
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                        + Add Item
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="glass-card filters-section">
                <div className="filters-grid">
                    <div className="input-group">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <select
                            className="select-field"
                            value={filterRoomId}
                            onChange={(e) => setFilterRoomId(e.target.value)}
                        >
                            <option value="">All Rooms</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <select
                            className="select-field"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <select
                            className="select-field"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <option value="">All Priorities</option>
                            {priorities.map(p => (
                                <option key={p.id || p.name} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <select
                            className="select-field"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="created_at">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                            <option value="cost">Sort by Cost</option>
                            <option value="priority">Sort by Priority</option>
                            <option value="delivery_date">Sort by Delivery Date</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="items-list">
                {filteredItems.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-icon">📦</div>
                        <h3>No items found</h3>
                        <p className="text-muted">Try adjusting your filters or add a new item</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="items-grid">
                        {filteredItems.map(item => renderItemCard(item))}
                    </div>
                ) : (
                    <div className="grouped-view">
                        {Object.entries(groupedItems)
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([groupName, items]) => (
                                <div key={groupName} className="room-group">
                                    <h2 className="room-group-header">{groupName}</h2>
                                    <div className="items-grid">
                                        {items.map(item => renderItemCard(item))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <ItemModal
                    item={editingItem}
                    initialRoomId={filterRoomId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}
