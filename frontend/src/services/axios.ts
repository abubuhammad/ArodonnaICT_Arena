import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  console.log('🚀 Request:', request);
  return request;
});

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ Response:', response);
    return response;
  },
  (error: AxiosError) => {
    console.log('❌ Response Error:', error);
    return Promise.reject(error);
  }
);

export default axios;
