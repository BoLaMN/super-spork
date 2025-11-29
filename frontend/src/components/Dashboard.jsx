import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const { itemStats, logisticsStats, settings } = useApp();

    if (!itemStats || !logisticsStats) {
        return (
            <div className="container">
                <div className="loading-state">Loading dashboard...</div>
            </div>
        );
    }

    const totalBudget = settings.total_budget ? parseFloat(settings.total_budget) : (itemStats.overall.total_budget || 0);
    const totalSpent = itemStats.overall.total_spent + logisticsStats.overall.total_cost;
    const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const itemsProgress = itemStats.overall.total_items > 0
        ? (itemStats.overall.completed_items / itemStats.overall.total_items) * 100
        : 0;

    const logisticsProgress = logisticsStats.overall.total_services > 0
        ? (logisticsStats.overall.completed_services / logisticsStats.overall.total_services) * 100
        : 0;

    const isWithin7Days = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
    };

    return (
        <div className="container dashboard">
            <header className="dashboard-header">
                <h1>Dashboard Overview</h1>
                <p className="text-muted">Track your home furnishing and setup progress</p>
            </header>

            {/* Key Metrics */}
            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-primary)' }}>🛋️</div>
                    <div className="stat-content">
                        <div className="stat-label">Furnishing Items</div>
                        <div className="stat-value">
                            {itemStats.overall.completed_items}/{itemStats.overall.total_items}
                        </div>
                        <div className="progress-container mt-sm">
                            <div
                                className="progress-bar"
                                style={{ width: `${itemsProgress}%` }}
                            ></div>
                        </div>
                        <div className="stat-sublabel">{Math.round(itemsProgress)}% Complete</div>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-success)' }}>⚡</div>
                    <div className="stat-content">
                        <div className="stat-label">Logistics Services</div>
                        <div className="stat-value">
                            {logisticsStats.overall.completed_services}/{logisticsStats.overall.total_services}
                        </div>
                        <div className="progress-container mt-sm">
                            <div
                                className="progress-bar"
                                style={{ width: `${logisticsProgress}%`, background: 'var(--gradient-success)' }}
                            ></div>
                        </div>
                        <div className="stat-sublabel">{Math.round(logisticsProgress)}% Complete</div>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-purple)' }}>💰</div>
                    <div className="stat-content">
                        <div className="stat-label">Budget Status</div>
                        <div className="stat-value">
                            ${totalSpent.toFixed(2)}
                        </div>
                        <div className="progress-container mt-sm">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${Math.min(budgetPercentage, 100)}%`,
                                    background: budgetPercentage > 90 ? 'var(--color-accent-danger)' : 'var(--gradient-purple)'
                                }}
                            ></div>
                        </div>
                        <div className="stat-sublabel">
                            {totalBudget > 0 ? `${Math.round(budgetPercentage)}% of $${totalBudget.toFixed(2)}` : 'No budget set'}
                        </div>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-blue)' }}>📋</div>
                    <div className="stat-content">
                        <div className="stat-label">Pending Tasks</div>
                        <div className="stat-value">
                            {(itemStats.overall.total_items - itemStats.overall.completed_items) +
                                (logisticsStats.overall.total_services - logisticsStats.overall.completed_services)}
                        </div>
                        <div className="stat-sublabel mt-sm">
                            {logisticsStats.overall.pending_services} logistics pending
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Breakdown */}
            <div className="section glass-card">
                <h2 className="section-title">Room Progress</h2>
                <div className="room-grid">
                    {itemStats.byRoom.map(room => {
                        const roomProgress = room.total_items > 0
                            ? (room.completed_items / room.total_items) * 100
                            : 0;

                        return (
                            <div 
                                key={room.room} 
                                className="room-card"
                                onClick={() => navigate(`/items?room_id=${room.room_id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="room-header">
                                    <span className="room-name">{room.room}</span>
                                    <span className="room-count">{room.completed_items}/{room.total_items}</span>
                                </div>
                                <div className="progress-container mt-sm">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${roomProgress}%` }}
                                    ></div>
                                </div>
                                <div className="room-budget mt-sm">
                                    <span className="text-muted">Budget:</span>
                                    <span>${room.spent?.toFixed(2) || '0.00'} / ${room.budget?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="upcoming-section">
                {itemStats.upcomingDeliveries && itemStats.upcomingDeliveries.length > 0 && (
                    <div className="glass-card">
                        <h2 className="section-title">🚚 Upcoming Deliveries (Next 7 Days)</h2>
                        <div className="event-list">
                            {itemStats.upcomingDeliveries.map(item => (
                                <div
                                    key={item.id}
                                    className={`event-item ${isWithin7Days(item.delivery_date) ? 'highlight' : ''}`}
                                >
                                    <div className="event-icon">📦</div>
                                    <div className="event-details">
                                        <div className="event-name">{item.name}</div>
                                        <div className="event-meta">
                                            <span className="text-muted">{item.room}</span>
                                            <span className="badge badge-info">{item.delivery_date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {logisticsStats.upcomingAppointments && logisticsStats.upcomingAppointments.length > 0 && (
                    <div className="glass-card">
                        <h2 className="section-title">📅 Upcoming Appointments (Next 7 Days)</h2>
                        <div className="event-list">
                            {logisticsStats.upcomingAppointments.map(appointment => (
                                <div
                                    key={appointment.id}
                                    className={`event-item ${isWithin7Days(appointment.scheduled_date) ? 'highlight' : ''}`}
                                >
                                    <div className="event-icon">⚡</div>
                                    <div className="event-details">
                                        <div className="event-name">{appointment.service_type.toUpperCase()}</div>
                                        <div className="event-meta">
                                            <span className="text-muted">{appointment.provider_name || 'No provider'}</span>
                                            <span className="badge badge-warning">{appointment.scheduled_date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
