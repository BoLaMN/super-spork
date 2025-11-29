const getApiBase = () => {
    const url = import.meta.env.VITE_API_URL;
    // If no VITE_API_URL is set (local dev), default to localhost:3001
    if (!url) return 'http://localhost:3001';
    // If the URL ends with a slash, remove it
    if (url.endsWith('/')) return url.slice(0, -1);
    return url;
};

const API_BASE = getApiBase();

// Generic fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Items API
export const itemsAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return fetchAPI(`/items?${params}`);
    },

    getStats: () => fetchAPI('/items/stats'),

    getById: (id) => fetchAPI(`/items/${id}`),

    create: (data) => fetchAPI('/items', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchAPI(`/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchAPI(`/items/${id}`, {
        method: 'DELETE',
    }),
};

// Logistics API
export const logisticsAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return fetchAPI(`/logistics?${params}`);
    },

    getStats: () => fetchAPI('/logistics/stats'),

    getById: (id) => fetchAPI(`/logistics/${id}`),

    create: (data) => fetchAPI('/logistics', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchAPI(`/logistics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchAPI(`/logistics/${id}`, {
        method: 'DELETE',
    }),
};

// Rooms API
export const roomsAPI = {
    getAll: () => fetchAPI('/rooms'),

    create: (data) => fetchAPI('/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchAPI(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchAPI(`/rooms/${id}`, {
        method: 'DELETE',
    }),
};

// Settings API
export const settingsAPI = {
    getAll: () => fetchAPI('/settings'),

    update: (key, value) => fetchAPI(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
    }),
};

// Priorities API
export const prioritiesAPI = {
    getAll: () => fetchAPI('/priorities'),
};
