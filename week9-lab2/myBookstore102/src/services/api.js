import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api/v1';

console.log('🚀 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  // บังคับให้ axios parse เป็น text ก่อน
  transformResponse: [(data, headers) => {
    const contentType = headers['content-type'] || '';
    
    // Log เพื่อ debug
    console.log('🔍 Response Content-Type:', contentType);
    console.log('🔍 Response Data (first 200 chars):', 
      typeof data === 'string' ? data.substring(0, 200) : data
    );
    
    // ถ้าเป็น HTML แสดงว่า endpoint ไม่มี
    if (contentType.includes('text/html')) {
      console.error('❌ Got HTML response instead of JSON!');
      console.error('This usually means the endpoint does not exist');
      throw new Error('Endpoint not found - Backend returned HTML instead of JSON');
    }
    
    // ถ้าเป็น JSON ให้ parse
    if (contentType.includes('application/json')) {
      try {
        return typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e);
        throw e;
      }
    }
    
    return data;
  }],
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Helper: ดึงข้อมูลจาก /books แล้ว filter
const getBooksAndFilter = async (filterFn, limit = 8) => {
  try {
    console.log('📚 Fetching all books from /books endpoint...');
    const response = await api.get('/books');
    
    if (!response.data) {
      console.warn('⚠️ No data in response');
      return { ...response, data: [] };
    }
    
    const books = Array.isArray(response.data) ? response.data : [];
    console.log(`📚 Got ${books.length} books, filtering...`);
    
    const filtered = filterFn ? books.filter(filterFn).slice(0, limit) : books.slice(0, limit);
    console.log(`✅ Filtered to ${filtered.length} books`);
    
    return { ...response, data: filtered };
  } catch (error) {
    console.error('❌ Error in getBooksAndFilter:', error);
    throw error;
  }
};

// Books API
export const booksAPI = {
  // Basic CRUD - ใช้ตรงๆ
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (book) => api.post('/books', book),
  update: (id, book) => api.put(`/books/${id}`, book),
  delete: (id) => api.delete(`/books/${id}`),
  search: (query) => api.get('/books/search', { params: { q: query } }),
  
  // Custom endpoints - fallback ไปใช้ /books แทน
  getFeatured: async (limit = 8) => {
    console.log('🌟 getFeatured called');
    
    // ลองเรียก endpoint จริงก่อน
    try {
      return await api.get('/books/featured', { params: { limit } });
    } catch (error) {
      console.warn('⚠️ /books/featured failed, using fallback filter');
      
      // ถ้าไม่ได้ ใช้ filter แทน
      return getBooksAndFilter(
        (book) => {
          // Filter: rating >= 4.5 หรือ is_featured = true
          return (book.rating && parseFloat(book.rating) >= 4.5) || 
                 book.is_featured === true ||
                 book.featured === true;
        },
        limit
      );
    }
  },
  
  getNew: async () => {
    console.log('🆕 getNew called');
    
    try {
      return await api.get('/books/new');
    } catch (error) {
      console.warn('⚠️ /books/new failed, using fallback filter');
      
      return getBooksAndFilter(
        (book) => {
          // Filter: created_at ในช่วง 30 วันที่ผ่านมา
          if (!book.created_at) return false;
          
          try {
            const createdDate = new Date(book.created_at);
            const now = new Date();
            const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
          } catch (e) {
            return false;
          }
        },
        8
      );
    }
  },
  
  getDiscounted: async () => {
    console.log('💰 getDiscounted called');
    
    try {
      return await api.get('/books/discounted');
    } catch (error) {
      console.warn('⚠️ /books/discounted failed, using fallback filter');
      
      return getBooksAndFilter(
        (book) => {
          // Filter: discount > 0
          return book.discount && parseFloat(book.discount) > 0;
        },
        8
      );
    }
  },
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default api;