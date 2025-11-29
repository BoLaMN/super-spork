import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './CalendarView.css';

export default function CalendarView() {
    const { items, logistics } = useApp();

    const events = useMemo(() => {
        const allEvents = [];

        // Add item deliveries
        items.forEach(item => {
            if (item.delivery_date) {
                allEvents.push({
                    id: `item-${item.id}`,
                    date: item.delivery_date,
                    title: item.name,
                    type: 'delivery',
                    room: item.room,
                    cost: item.cost
                });
            }
        });

        // Add logistics appointments
        logistics.forEach(entry => {
            if (entry.scheduled_date) {
                allEvents.push({
                    id: `logistics-${entry.id}`,
                    date: entry.scheduled_date,
                    title: entry.service_type.toUpperCase(),
                    type: 'appointment',
                    provider: entry.provider_name,
                    status: entry.completion_status
                });
            }
        });

        // Sort by date
        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        return allEvents;
    }, [items, logistics]);

    const getEventBadgeClass = (type) => {
        return type === 'delivery' ? 'badge-info' : 'badge-warning';
    };

    return (
        <div className="container calendar-view">
            <header className="page-header">
                <h1>Calendar View</h1>
                <p className="text-muted">Upcoming deliveries and appointments</p>
            </header>

            {events.length === 0 ? (
                <div className="empty-state glass-card">
                    <div className="empty-icon">📅</div>
                    <h3>No scheduled events</h3>
                    <p className="text-muted">Add delivery dates or service appointments to see them here</p>
                </div>
            ) : (
                <div className="events-container glass-card">
                    <div className="events-list">
                        {events.map(event => {
                            const eventDate = new Date(event.date);
                            const isUpcoming = eventDate >= new Date();
                            const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));

                            return (
                                <div
                                    key={event.id}
                                    className={`calendar-event ${isUpcoming && daysUntil <= 7 ? 'upcoming' : ''}`}
                                >
                                    <div className="event-date-block">
                                        <div className="event-month">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                                        <div className="event-day">{eventDate.getDate()}</div>
                                        <div className="event-year">{eventDate.getFullYear()}</div>
                                    </div>

                                    <div className="event-content">
                                        <div className="event-title-row">
                                            <h3 className="event-title">{event.title}</h3>
                                            <span className={`badge ${getEventBadgeClass(event.type)}`}>
                                                {event.type === 'delivery' ? '📦 Delivery' : '⚡ Appointment'}
                                            </span>
                                        </div>

                                        <div className="event-meta">
                                            {event.room && <span>🏠 {event.room}</span>}
                                            {event.provider && <span>🏢 {event.provider}</span>}
                                            {event.status && <span>Status: {event.status}</span>}
                                            {event.cost > 0 && <span className="event-cost">${event.cost.toFixed(2)}</span>}
                                        </div>

                                        {isUpcoming && daysUntil <= 7 && (
                                            <div className="event-countdown">
                                                {daysUntil === 0 ? '📍 Today' :
                                                    daysUntil === 1 ? '📍 Tomorrow' :
                                                        `📍 In ${daysUntil} days`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
