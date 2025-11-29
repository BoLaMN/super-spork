import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './BudgetTracker.css';

export default function BudgetTracker() {
    const { itemStats, logisticsStats, settings, updateSetting } = useApp();
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState('');

    // Use budget from settings or fallback to itemStats total (which was sum of allocated)
    // But now we want a global budget override.
    // If settings.total_budget exists, use it. Otherwise default to 0.
    const totalBudget = settings.total_budget ? parseFloat(settings.total_budget) : 0;

    useEffect(() => {
        if (settings.total_budget) {
            setTempBudget(settings.total_budget);
        }
    }, [settings.total_budget]);

    const handleSaveBudget = async () => {
        const value = parseFloat(tempBudget);
        if (!isNaN(value) && value >= 0) {
            await updateSetting('total_budget', value);
            setIsEditingBudget(false);
        }
    };

    if (!itemStats || !logisticsStats) {
        return (
            <div className="container">
                <div className="loading-state">Loading budget data...</div>
            </div>
        );
    }

    const itemsSpent = itemStats.overall.total_spent || 0;
    const logisticsSpent = logisticsStats.overall.total_cost || 0;
    const totalSpent = itemsSpent + logisticsSpent;
    const remaining = totalBudget - totalSpent;
    const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const isOverBudget = totalSpent > totalBudget && totalBudget > 0;

    return (
        <div className="container budget-tracker">
            <header className="page-header">
                <h1>Budget Tracker</h1>
                <p className="text-muted">Monitor your spending and budget allocation</p>
            </header>

            {/* Summary Cards */}
            <div className="budget-summary-grid">
                <div className="budget-card glass-card">
                    <div className="budget-label">Total Budget</div>
                    {isEditingBudget ? (
                        <div className="budget-edit-form">
                            <input
                                type="number"
                                className="input-field text-center"
                                value={tempBudget}
                                onChange={(e) => setTempBudget(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-center gap-sm mt-sm">
                                <button className="btn btn-sm btn-primary" onClick={handleSaveBudget}>Save</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setIsEditingBudget(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="budget-value">${totalBudget.toFixed(2)}</div>
                            <button
                                className="btn btn-xs btn-secondary"
                                onClick={() => {
                                    setTempBudget(totalBudget);
                                    setIsEditingBudget(true);
                                }}
                            >
                                ✏️ Edit Budget
                            </button>
                        </>
                    )}
                </div>

                <div className="budget-card glass-card">
                    <div className="budget-label">Total Spent</div>
                    <div className="budget-value" style={{ color: isOverBudget ? 'var(--color-accent-danger)' : 'var(--color-accent-success)' }}>
                        ${totalSpent.toFixed(2)}
                    </div>
                    <div className="budget-breakdown">
                        <span>Items: ${itemsSpent.toFixed(2)}</span>
                        <span>Logistics: ${logisticsSpent.toFixed(2)}</span>
                    </div>
                </div>

                <div className="budget-card glass-card">
                    <div className="budget-label">Remaining</div>
                    <div className="budget-value" style={{ color: remaining < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-primary)' }}>
                        ${remaining.toFixed(2)}
                    </div>
                    <div className="progress-container mt-sm">
                        <div
                            className="progress-bar"
                            style={{
                                width: `${Math.min(budgetPercentage, 100)}%`,
                                background: isOverBudget ? 'var(--color-accent-danger)' : 'var(--gradient-success)'
                            }}
                        ></div>
                    </div>
                    <div className="budget-percentage">{Math.round(budgetPercentage)}% of budget used</div>
                </div>
            </div>

            {isOverBudget && (
                <div className="budget-warning glass-card">
                    ⚠️ Warning: You have exceeded your budget by ${Math.abs(remaining).toFixed(2)}
                </div>
            )}

            {/* By Room Breakdown */}
            <div className="glass-card budget-section">
                <h2>Budget by Room</h2>
                <div className="budget-breakdown-grid">
                    {itemStats.byRoom.map(room => {
                        const roomSpent = room.spent || 0;
                        const roomBudget = room.budget || 0; // This is sum of item budgets, not room budget setting
                        const roomPercentage = roomBudget > 0 ? (roomSpent / roomBudget) * 100 : 0;

                        return (
                            <div key={room.room_id} className="budget-breakdown-item">
                                <div className="breakdown-header">
                                    <span className="breakdown-name">{room.room}</span>
                                    <span className="breakdown-amount">${roomSpent.toFixed(2)} / ${roomBudget.toFixed(2)} (Allocated)</span>
                                </div>
                                <div className="progress-container mt-sm">
                                    <div
                                        className="progress-bar"
                                        style={{
                                            width: `${Math.min(roomPercentage, 100)}%`,
                                            background: roomPercentage > 100 ? 'var(--color-accent-danger)' : 'var(--gradient-blue)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* By Priority Breakdown */}
            <div className="glass-card budget-section">
                <h2>Budget by Priority</h2>
                <div className="budget-breakdown-grid">
                    {itemStats.byPriority.map(priority => {
                        const prioritySpent = priority.spent || 0;
                        const priorityBudget = priority.budget || 0;

                        return (
                            <div key={priority.priority} className="budget-breakdown-item">
                                <div className="breakdown-header">
                                    <span className="breakdown-name">{priority.priority}</span>
                                    <span className="breakdown-amount">${prioritySpent.toFixed(2)} / ${priorityBudget.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-stats">
                                    <span>{priority.total_items} items</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
