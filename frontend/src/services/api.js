const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

// ============ AUTH APIs ============
export const authAPI = {
  login: async (email, password) => {
    return await authFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData) => {
    return await authFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  forgotPassword: async (email) => {
    return await authFetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp: async (email, otp) => {
    return await authFetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (email, newPassword) => {
    return await authFetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  getProfile: async () => {
    return await authFetch(`${API_BASE_URL}/auth/profile`);
  },

  updateProfile: async (userData) => {
    return await authFetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return await authFetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
};

// ============ PRODUCT APIs ============
export const productAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return await authFetch(`${API_BASE_URL}/products?${params}`);
  },

  getLowStock: async () => {
    return await authFetch(`${API_BASE_URL}/products/low-stock`);
  },

  getById: async (id) => {
    return await authFetch(`${API_BASE_URL}/products/${id}`);
  },

  create: async (productData) => {
    return await authFetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  update: async (id, productData) => {
    return await authFetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (id) => {
    return await authFetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
  }
};

// ============ OPERATIONS APIs ============
export const operationsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return await authFetch(`${API_BASE_URL}/operations?${params}`);
  },

  getDashboardStats: async () => {
    return await authFetch(`${API_BASE_URL}/operations/dashboard-stats`);
  },

  createReceipt: async (receiptData) => {
    return await authFetch(`${API_BASE_URL}/operations/receipt`, {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  },

  createDelivery: async (deliveryData) => {
    return await authFetch(`${API_BASE_URL}/operations/delivery`, {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  },

  createTransfer: async (transferData) => {
    return await authFetch(`${API_BASE_URL}/operations/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  },

  createAdjustment: async (adjustmentData) => {
    return await authFetch(`${API_BASE_URL}/operations/adjustment`, {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  },

  validate: async (id) => {
    return await authFetch(`${API_BASE_URL}/operations/${id}/validate`, {
      method: 'PUT',
    });
  },

  cancel: async (id) => {
    return await authFetch(`${API_BASE_URL}/operations/${id}/cancel`, {
      method: 'PUT',
    });
  },

  // ============ PICKING APIs ============
  getPickingTasks: async () => {
    return await authFetch(`${API_BASE_URL}/operations/picking-tasks`);
  },

  completePicking: async (id) => {
    return await authFetch(`${API_BASE_URL}/operations/picking-tasks/${id}/complete`, {
      method: 'PUT',
    });
  },

  // ============ SHELVING APIs ============
  getShelvingTasks: async () => {
    return await authFetch(`${API_BASE_URL}/operations/shelving-tasks`);
  },

  completeShelving: async (id, location) => {
    return await authFetch(`${API_BASE_URL}/operations/shelving-tasks/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ location }),
    });
  },

  // ============ PACKING APIs ============
  getPackingTasks: async () => {
    return await authFetch(`${API_BASE_URL}/operations/packing-tasks`);
  },

  completePacking: async (id, packingDetails) => {
    return await authFetch(`${API_BASE_URL}/operations/packing-tasks/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(packingDetails),
    });
  },

  // ============ STOCK LEDGER APIs ============
  getStockLedger: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return await authFetch(`${API_BASE_URL}/operations/stock-ledger?${params}`);
  },

  // ============ STOCK COUNTING APIs ============
  getCountingSessions: async () => {
    return await authFetch(`${API_BASE_URL}/operations/counting-sessions`);
  },

  createCountingSession: async (sessionData) => {
    return await authFetch(`${API_BASE_URL}/operations/counting-sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  saveCountingSession: async (id, items) => {
    return await authFetch(`${API_BASE_URL}/operations/counting-sessions/${id}/save`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  }
};

// ============ WAREHOUSE APIs ============
export const warehouseAPI = {
  getAll: async () => {
    return await authFetch(`${API_BASE_URL}/warehouses`);
  },

  getById: async (id) => {
    return await authFetch(`${API_BASE_URL}/warehouses/${id}`);
  },

  create: async (warehouseData) => {
    return await authFetch(`${API_BASE_URL}/warehouses`, {
      method: 'POST',
      body: JSON.stringify(warehouseData),
    });
  },

  update: async (id, warehouseData) => {
    return await authFetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(warehouseData),
    });
  },

  delete: async (id) => {
    return await authFetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: 'DELETE',
    });
  }
};

export default { auth: authAPI, products: productAPI, operations: operationsAPI, warehouse: warehouseAPI };