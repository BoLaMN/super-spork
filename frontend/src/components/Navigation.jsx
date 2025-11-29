import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Navigation.css';

export default function Navigation() {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/items', label: 'Furnishing Items', icon: '🛋️' },
        { path: '/logistics', label: 'Logistics Panel', icon: '⚡' },
        { path: '/rooms', label: 'Room View', icon: '🏠' },
        { path: '/budget', label: 'Budget Tracker', icon: '💰' },
        { path: '/calendar', label: 'Calendar', icon: '📅' },
    ];

    return (
        <nav className="navigation">
            <div className="nav-container">
                <div className="nav-brand">
                    <h1 className="brand-title">🏡 House Planner</h1>
                </div>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>

                <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    {navItems.map(item => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
