import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api'
});

adminApi.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

export default adminApi;
