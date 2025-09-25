import axios from 'axios';

// Создаем настраиваемый экземпляр axios
const createAxiosInstance = (baseURL?: string) => {
  const axiosInstance = axios.create({
    baseURL: baseURL || '',
    withCredentials: true,
  });

  // Вспомогательная функция для получения cookie
  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }

  // Добавляем перехватчик запросов для добавления токена
  axiosInstance.interceptors.request.use(config => {
    const token = getCookie('key');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  });

  // Добавляем перехватчик ответов для обработки ошибок
  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('show-auth-dialog'));
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// Экспортируем функцию создания экземпляра и по умолчанию один экземпляр
export { createAxiosInstance };
export default createAxiosInstance(); 