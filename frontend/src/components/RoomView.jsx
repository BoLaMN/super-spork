import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import RoomModal from './RoomModal';
import './RoomView.css';

export default function RoomView() {
    const navigate = useNavigate();
    const { items, rooms, itemStats } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);

    const roomData = useMemo(() => {
        return rooms.map(room => {
            const roomItems = items.filter(item => item.room_id === room.id);
            const stats = itemStats?.byRoom.find(s => s.room_id === room.id) || {
                completed_items: 0,
                total_items: 0,
                spent: 0,
                budget: 0
            };

            return {
                ...room,
                items: roomItems,
                stats
            };
        });
    }, [items, rooms, itemStats]);

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'Completed') return 'badge-success';
        if (status === 'Delivered' || status === 'Ordered') return 'badge-info';
        if (status === 'Ready to Purchase') return 'badge-warning';
        return 'badge-purple';
    };

    return (
        <div className="container room-view">
            <header className="page-header">
                <div>
                    <h1>Room View</h1>
                    <p className="text-muted">Organize items by room</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    + Add Room
                </button>
            </header>

            <div className="rooms-container">
                {roomData.map(room => {
                    const progress = room.stats.total_items > 0
                        ? (room.stats.completed_items / room.stats.total_items) * 100
                        : 0;

                    // Use room.budget if set, otherwise use sum of item budgets
                    const displayBudget = room.budget > 0 ? room.budget : room.stats.budget;

                    return (
                        <div 
                            key={room.id} 
                            className="room-section glass-card"
                            onClick={() => navigate(`/items?room_id=${room.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="room-section-header">
                                <div className="flex items-center gap-md">
                                    <h2>{room.name}</h2>
                                    <button
                                        className="btn-icon-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditRoom(room);
                                        }}
                                        title="Edit Room"
                                    >
                                        ✏️
                                    </button>
                                </div>
                                <div className="room-stats">
                                    <span className="stat-badge">{room.stats.completed_items}/{room.stats.total_items} items</span>
                                    <span className="stat-badge">
                                        ${room.stats.spent?.toFixed(2) || '0.00'} / ${displayBudget?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>

                            <div className="progress-container mb-md">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="progress-label">{Math.round(progress)}% complete</p>

                            {room.description && (
                                <p className="text-muted text-sm mb-md">{room.description}</p>
                            )}

                            {room.items.length > 0 ? (
                                <div className="room-items-grid">
                                    {room.items.map(item => (
                                        <div key={item.id} className="room-item-card">
                                            <div className="room-item-header">
                                                <h4>{item.name}</h4>
                                                <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            {item.cost > 0 && (
                                                <div className="room-item-cost">${item.cost.toFixed(2)}</div>
                                            )}
                                            {item.description && (
                                                <p className="room-item-description">{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted text-center p-md">
                                    No items in this room yet.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Spacer to ensure bottom scrolling */}
            <div style={{ height: '20px', width: '100%' }}></div>

            {isModalOpen && (
                <RoomModal
                    room={editingRoom}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}
