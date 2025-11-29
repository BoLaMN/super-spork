import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ItemManager from './components/ItemManager';
import LogisticsPanel from './components/LogisticsPanel';
import RoomView from './components/RoomView';
import BudgetTracker from './components/BudgetTracker';
import CalendarView from './components/CalendarView';
import './styles/design-system.css';

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="app">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items" element={<ItemManager />} />
              <Route path="/logistics" element={<LogisticsPanel />} />
              <Route path="/rooms" element={<RoomView />} />
              <Route path="/budget" element={<BudgetTracker />} />
              <Route path="/calendar" element={<CalendarView />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
