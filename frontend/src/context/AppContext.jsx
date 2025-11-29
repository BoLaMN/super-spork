import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { itemsAPI, logisticsAPI, roomsAPI, settingsAPI, prioritiesAPI } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [items, setItems] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [settings, setSettings] = useState({});
    const [itemStats, setItemStats] = useState(null);
    const [logisticsStats, setLogisticsStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all items
    const fetchItems = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await itemsAPI.getAll(filters);
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch item statistics
    const fetchItemStats = useCallback(async () => {
        try {
            const data = await itemsAPI.getStats();
            setItemStats(data);
        } catch (err) {
            console.error('Error fetching item stats:', err);
        }
    }, []);

    // Fetch rooms
    const fetchRooms = useCallback(async () => {
        try {
            const data = await roomsAPI.getAll();
            setRooms(data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    }, []);

    // Fetch priorities
    const fetchPriorities = useCallback(async () => {
        try {
            const data = await prioritiesAPI.getAll();
            setPriorities(data);
        } catch (err) {
            console.error('Error fetching priorities:', err);
        }
    }, []);

    // Fetch settings
    const fetchSettings = useCallback(async () => {
        try {
            const data = await settingsAPI.getAll();
            setSettings(data);
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    }, []);

    // Update setting
    const updateSetting = useCallback(async (key, value) => {
        try {
            await settingsAPI.update(key, value);
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Create room
    const createRoom = useCallback(async (roomData) => {
        try {
            const newRoom = await roomsAPI.create(roomData);
            setRooms(prev => [...prev, newRoom].sort((a, b) => a.name.localeCompare(b.name)));
            return newRoom;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Update room
    const updateRoom = useCallback(async (id, roomData) => {
        try {
            const updatedRoom = await roomsAPI.update(id, roomData);
            setRooms(prev => prev.map(room => room.id === id ? updatedRoom : room).sort((a, b) => a.name.localeCompare(b.name)));
            return updatedRoom;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Create item
    const createItem = useCallback(async (itemData) => {
        try {
            const newItem = await itemsAPI.create(itemData);
            setItems(prev => [newItem, ...prev]);
            await fetchItemStats();
            return newItem;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [fetchItemStats]);

    // Update item
    const updateItem = useCallback(async (id, itemData) => {
        try {
            const updatedItem = await itemsAPI.update(id, itemData);
            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
            await fetchItemStats();
            return updatedItem;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [fetchItemStats]);

    // Delete item
    const deleteItem = useCallback(async (id) => {
        try {
            await itemsAPI.delete(id);
            setItems(prev => prev.filter(item => item.id !== id));
            await fetchItemStats();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [fetchItemStats]);

    // Fetch all logistics
    const fetchLogistics = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await logisticsAPI.getAll(filters);
            setLogistics(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch logistics statistics
    const fetchLogisticsStats = useCallback(async () => {
        try {
            const data = await logisticsAPI.getStats();
            setLogisticsStats(data);
        } catch (err) {
            console.error('Error fetching logistics stats:', err);
        }
    }, []);

    // Create logistics entry
    const createLogistics = useCallback(async (logisticsData) => {
        try {
            const newEntry = await logisticsAPI.create(logisticsData);
            setLogistics(prev => [newEntry, ...prev]);
            await fetchLogisticsStats();
            return newEntry;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [fetchLogisticsStats]);

    // Update logistics entry
    const updateLogistics = useCallback(async (id, logisticsData) => {
        try {
            const updatedEntry = await logisticsAPI.update(id, logisticsData);
            setLogistics(prev => prev.map(entry => entry.id === id ? updatedEntry : entry));
            await fetchLogisticsStats();
            return updatedEntry;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [fetchLogisticsStats]);

    // Delete logistics entry
    const deleteLogistics = useCallback(async (id) => {
        try {
            await logisticsAPI.delete(id);
            setLogistics(prev => prev.filter(entry => entry.id !== id));
            await fetchLogisticsStats();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [fetchLogisticsStats]);

    // Load initial data
    useEffect(() => {
        fetchRooms();
        fetchItems();
        fetchLogistics();
        fetchItemStats();
        fetchLogisticsStats();
        fetchSettings();
        fetchPriorities();
    }, [fetchRooms, fetchItems, fetchLogistics, fetchItemStats, fetchLogisticsStats, fetchSettings, fetchPriorities]);

    const value = {
        items,
        logistics,
        rooms,
        priorities,
        settings,
        itemStats,
        logisticsStats,
        loading,
        error,
        fetchItems,
        fetchItemStats,
        fetchRooms,
        fetchSettings,
        fetchPriorities,
        updateSetting,
        createRoom,
        updateRoom,
        createItem,
        updateItem,
        deleteItem,
        fetchLogistics,
        fetchLogisticsStats,
        createLogistics,
        updateLogistics,
        deleteLogistics,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
