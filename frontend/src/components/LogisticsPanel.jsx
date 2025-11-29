import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import LogisticsModal from './LogisticsModal';
import './LogisticsPanel.css';

const STATUSES = ['Pending', 'In Progress', 'Completed'];

export default function LogisticsPanel() {
    const { logistics, deleteLogistics, updateLogistics } = useApp();
    const [filterService, setFilterService] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const availableServiceTypes = useMemo(() => {
        const types = new Set(logistics.map(l => l.service_type));
        return Array.from(types).sort();
    }, [logistics]);

    const filteredLogistics = logistics.filter(entry => {
        const matchesService = !filterService || entry.service_type === filterService;
        const matchesStatus = !filterStatus || entry.completion_status === filterStatus;
        return matchesService && matchesStatus;
    });

    const handleToggleStatus = async (entry) => {
        const newStatus = entry.completion_status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await updateLogistics(entry.id, { ...entry, completion_status: newStatus });
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this logistics entry?')) {
            await deleteLogistics(id);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingEntry(null);
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'Completed') return 'badge-success';
        if (status === 'In Progress') return 'badge-warning';
        return 'badge-info';
    };

    const getPriorityBadgeClass = (priority) => {
        if (priority === 'Day 1') return 'badge-danger';
        if (priority === 'Week 1') return 'badge-warning';
        return 'badge-secondary';
    };

    return (
        <div className="container logistics-panel">
            <header className="page-header">
                <div>
                    <h1>Logistics Panel</h1>
                    <p className="text-muted">Track utility connections and home setup services</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    + Add Service
                </button>
            </header>

            {/* Filters */}
            <div className="glass-card filters-section">
                <div className="filters-grid">
                    <div className="input-group">
                        <select
                            className="select-field"
                            value={filterService}
                            onChange={(e) => setFilterService(e.target.value)}
                        >
                            <option value="">All Services</option>
                            {availableServiceTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
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
                </div>
            </div>

            {/* Logistics List */}
            <div className="logistics-list">
                {filteredLogistics.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-icon">⚡</div>
                        <h3>No logistics entries found</h3>
                        <p className="text-muted">Add a service to get started</p>
                    </div>
                ) : (
                    <div className="logistics-grid">
                        {filteredLogistics.map(entry => (
                            <div key={entry.id} className={`logistics-card glass-card ${entry.completion_status === 'Completed' ? 'logistics-completed' : ''}`}>
                                <div className="logistics-header">
                                    <button 
                                        className={`status-toggle-btn ${entry.completion_status === 'Completed' ? 'checked' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(entry);
                                        }}
                                        title={entry.completion_status === 'Completed' ? "Mark as Pending" : "Mark as Completed"}
                                    >
                                        {entry.completion_status === 'Completed' ? '✓' : ''}
                                    </button>
                                    <div className="logistics-info">
                                        <div className="service-type-badge">
                                            {entry.service_type}
                                        </div>
                                    </div>
                                    <div className="badges-container">
                                        {entry.priority && (
                                            <span className={`badge ${getPriorityBadgeClass(entry.priority)}`}>
                                                {entry.priority}
                                            </span>
                                        )}
                                        <span className={`badge ${getStatusBadgeClass(entry.completion_status)}`}>
                                            {entry.completion_status}
                                        </span>
                                    </div>
                                </div>

                                <div className="logistics-details">
                                    {entry.provider_name && (
                                        <div className="detail-row">
                                            <span className="detail-label">🏢 Provider:</span>
                                            <span>{entry.provider_name}</span>
                                        </div>
                                    )}
                                    {entry.account_number && (
                                        <div className="detail-row">
                                            <span className="detail-label">📋 Account #:</span>
                                            <span>{entry.account_number}</span>
                                        </div>
                                    )}
                                    {entry.application_date && (
                                        <div className="detail-row">
                                            <span className="detail-label">📝 Applied:</span>
                                            <span>{entry.application_date}</span>
                                        </div>
                                    )}
                                    {entry.scheduled_date && (
                                        <div className="detail-row">
                                            <span className="detail-label">📅 Scheduled:</span>
                                            <span>{entry.scheduled_date}</span>
                                        </div>
                                    )}
                                    {entry.cost > 0 && (
                                        <div className="detail-row">
                                            <span className="detail-label">💰 Cost:</span>
                                            <span className="cost-value">${entry.cost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {entry.contact_info && (
                                        <div className="detail-row">
                                            <span className="detail-label">📞 Contact:</span>
                                            <span>{entry.contact_info}</span>
                                        </div>
                                    )}
                                    {entry.notes && (
                                        <div className="logistics-notes">
                                            <p>{entry.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="logistics-actions">
                                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(entry)}>
                                        ✏️ Edit
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry.id)}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <LogisticsModal
                    entry={editingEntry}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}
