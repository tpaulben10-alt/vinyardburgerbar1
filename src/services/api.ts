export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('token');

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const authAPI = {
  login: (email: string, password: string) => 
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  register: (data: { name: string; email: string; password: string; phone: string; address: string }) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  googleLogin: (credential: string) =>
    apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    }),
  
  logout: () => fetchWithAuth('/auth/logout', { method: 'POST' })
};

export const userAPI = {
  getProfile: () => fetchWithAuth('/user/profile'),
  updateProfile: (data: { name: string; phone: string; address: string }) =>
    fetchWithAuth('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};

export const menuAPI = {
  getMenu: () => fetch(`${API_URL}/menu`).then(res => res.json()),
  getItem: (id: number) => fetch(`${API_URL}/menu/${id}`).then(res => res.json())
};

export const orderAPI = {
  createOrder: (data: any) => fetchWithAuth('/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMyOrders: () => fetchWithAuth('/orders/my-orders'),
  getOrder: (id: number) => fetchWithAuth(`/orders/${id}`)
};

export const adminAPI = {
  getOrders: (params?: { status?: string; date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    return fetchWithAuth(`/admin/orders?${queryParams}`);
  },
  updateOrderStatus: (id: number, status: string) =>
    fetchWithAuth(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  getCustomers: () => fetchWithAuth('/admin/customers'),
  getOnlineUsers: () => fetchWithAuth('/admin/online-users'),
  updateUserRole: (id: number, role: string) =>
    fetchWithAuth(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  getDashboardStats: () => fetchWithAuth('/admin/dashboard-stats'),
  addMenuItem: (data: any) => fetchWithAuth('/admin/menu', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateMenuItem: (id: number, data: any) => fetchWithAuth(`/admin/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

export const reviewAPI = {
  createReview: (data: { order_id: number; rating: number; comment: string }) =>
    fetchWithAuth('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getReviews: () => fetch(`${API_URL}/reviews`).then(res => res.json())
};

export const loyaltyAPI = {
  getRewards: () => fetch(`${API_URL}/loyalty/rewards`).then(res => res.json()),
  redeemReward: (reward_id: number) =>
    fetchWithAuth('/loyalty/redeem', {
      method: 'POST',
      body: JSON.stringify({ reward_id })
    })
};
