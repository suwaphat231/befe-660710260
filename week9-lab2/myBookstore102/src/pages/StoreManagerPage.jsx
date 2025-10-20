import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { booksAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

function StoreManagerPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // ตรวจสอบว่า login แล้วหรือยัง
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
      return;
    }

    fetchBooks();
    fetchCategories();
  }, [selectedCategory, navigate]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      const response = await booksAPI.getAll(params);
      setBooks(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch books: ' + err.message);
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      fetchBooks();
      return;
    }
    
    try {
      setLoading(true);
      setSearchQuery(query);
      const response = await booksAPI.search(query);
      setBooks(response.data || []);
      setError(null);
    } catch (err) {
      setError('Search failed: ' + err.message);
      console.error('Error searching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`คุณต้องการลบหนังสือ "${title}" หรือไม่?`)) {
      try {
        await booksAPI.delete(id);
        alert('ลบหนังสือสำเร็จ');
        fetchBooks();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการลบหนังสือ: ' + err.message);
        console.error('Error deleting book:', err);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                📚 จัดการคลังหนังสือ
              </h1>
              <p className="text-gray-600">
                แก้ไข ลบ และจัดการหนังสือทั้งหมดในระบบ
              </p>
            </div>
            <Link
              to="/add-book"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition inline-flex items-center shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มหนังสือใหม่
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />
        
        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">กรองตามหมวดหมู่</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-lg transition ${
                !selectedCategory
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ทุกหมวดหมู่ ({books.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">เกิดข้อผิดพลาด!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 text-xl">ไม่พบหนังสือในระบบ</p>
            <Link
              to="/add-book"
              className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              เพิ่มหนังสือเล่มแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Book Image */}
                  <div className="md:w-48 flex-shrink-0">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">ไม่มีรูปภาพ</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Book Details */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-2xl font-bold text-gray-800 hover:text-green-600 transition-colors">
                            {book.title}
                          </h3>
                          <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                            ID: {book.id}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-lg mb-2">โดย {book.author}</p>
                        
                        {book.category && (
                          <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full mb-3">
                            {book.category}
                          </span>
                        )}
                        
                        {book.isbn && (
                          <p className="text-gray-500 text-sm mb-2">
                            <span className="font-semibold">ISBN:</span> {book.isbn}
                          </p>
                        )}
                        
                        {book.year && (
                          <p className="text-gray-500 text-sm mb-2">
                            <span className="font-semibold">ปีที่พิมพ์:</span> {book.year}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <span className="text-green-600 font-bold text-2xl">฿{book.price}</span>
                            {book.original_price && book.discount > 0 && (
                              <>
                                <span className="text-gray-400 line-through text-lg ml-2">
                                  ฿{book.original_price}
                                </span>
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-sm font-bold rounded">
                                  ลด {book.discount}%
                                </span>
                              </>
                            )}
                          </div>
                          
                          {book.rating > 0 && (
                            <div className="flex items-center text-yellow-500">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="ml-1 text-lg font-semibold">{book.rating}</span>
                              {book.reviews_count > 0 && (
                                <span className="ml-1 text-gray-500 text-sm">
                                  ({book.reviews_count} รีวิว)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex md:flex-col gap-2 md:w-40">
                        <Link
                          to={`/books/${book.id}`}
                          className="flex-1 md:flex-none bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition text-center text-sm font-semibold inline-flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          ดูรายละเอียด
                        </Link>
                        
                        <Link
                          to={`/edit-book/${book.id}`}
                          className="flex-1 md:flex-none bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition text-center text-sm font-semibold inline-flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          แก้ไข
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          className="flex-1 md:flex-none bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition text-sm font-semibold inline-flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreManagerPage;