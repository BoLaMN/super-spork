import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const STATUSES = ['Pending', 'In Progress', 'Completed'];

export default function LogisticsModal({ entry, onClose }) {
    const { createLogistics, updateLogistics } = useApp();
    const [formData, setFormData] = useState({
        service_type: '',
        provider_name: '',
        application_date: '',
        scheduled_date: '',
        completion_status: 'Pending',
        priority: 'Normal',
        account_number: '',
        contact_info: '',
        cost: 0,
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (entry) {
            setFormData({
                service_type: entry.service_type || '',
                provider_name: entry.provider_name || '',
                application_date: entry.application_date || '',
                scheduled_date: entry.scheduled_date || '',
                completion_status: entry.completion_status || 'Pending',
                priority: entry.priority || 'Normal',
                account_number: entry.account_number || '',
                contact_info: entry.contact_info || '',
                cost: entry.cost || 0,
                notes: entry.notes || '',
            });
        }
    }, [entry]);

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
            if (entry) {
                await updateLogistics(entry.id, formData);
            } else {
                await createLogistics(formData);
            }
            onClose();
        } catch (error) {
            alert('Error saving logistics entry: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{entry ? 'Edit Service' : 'Add New Service'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="grid grid-2 gap-md">
                            <div className="input-group">
                                <label className="input-label">Service Type *</label>
                                <input
                                    type="text"
                                    name="service_type"
                                    className="input-field"
                                    value={formData.service_type}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Electricity"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Provider Name</label>
                                <input
                                    type="text"
                                    name="provider_name"
                                    className="input-field"
                                    value={formData.provider_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Priority</label>
                                <input
                                    type="text"
                                    name="priority"
                                    className="input-field"
                                    placeholder="e.g. Day 1, Week 1"
                                    value={formData.priority}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Completion Status</label>
                                <select
                                    name="completion_status"
                                    className="select-field"
                                    value={formData.completion_status}
                                    onChange={handleChange}
                                >
                                    {STATUSES.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Application Date</label>
                                <input
                                    type="date"
                                    name="application_date"
                                    className="input-field"
                                    value={formData.application_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Scheduled Date</label>
                                <input
                                    type="date"
                                    name="scheduled_date"
                                    className="input-field"
                                    value={formData.scheduled_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Account Number</label>
                                <input
                                    type="text"
                                    name="account_number"
                                    className="input-field"
                                    value={formData.account_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Contact Info</label>
                                <input
                                    type="text"
                                    name="contact_info"
                                    className="input-field"
                                    placeholder="Phone or email"
                                    value={formData.contact_info}
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
                        </div>

                        <div className="input-group">
                            <label className="input-label">Notes</label>
                            <textarea
                                name="notes"
                                className="textarea-field"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="4"
                            ></textarea>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : (entry ? 'Update Service' : 'Add Service')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
