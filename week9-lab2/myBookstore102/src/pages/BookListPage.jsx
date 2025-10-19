import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { booksAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

function BookListPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [selectedCategory]);

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
        fetchBooks(); // Refresh list
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการลบหนังสือ: ' + err.message);
        console.error('Error deleting book:', err);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold">รายการหนังสือทั้งหมด</h1>
        <Link
          to="/add-book"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition inline-flex items-center shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มหนังสือ
        </Link>
      </div>
      
      <SearchBar onSearch={handleSearch} />
      
      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange('')}
          className={`px-4 py-2 rounded-lg transition ${
            !selectedCategory
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ทุกหมวดหมู่
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {books.length === 0 ? (
        <div className="text-center text-gray-500 text-xl py-12">
          ไม่พบหนังสือ
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <Link to={`/books/${book.id}`}>
                <div className="relative overflow-hidden">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">ไม่มีรูปภาพ</span>
                    </div>
                  )}
                  {book.discount > 0 && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{book.discount}%
                    </span>
                  )}
                  {book.is_new && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      NEW
                    </span>
                  )}
                </div>
              </Link>
              
              <div className="p-4">
                <Link to={`/books/${book.id}`}>
                  <h3 className="font-semibold text-lg mb-1 hover:text-green-600 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                
                {book.category && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-3">
                    {book.category}
                  </span>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-green-600 font-bold text-xl">฿{book.price}</span>
                    {book.original_price && book.discount > 0 && (
                      <span className="text-gray-400 line-through text-sm ml-2">
                        ฿{book.original_price}
                      </span>
                    )}
                  </div>
                  {book.rating > 0 && (
                    <div className="flex items-center text-yellow-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm font-semibold">{book.rating}</span>
                    </div>
                  )}
                </div>
                
                {/* Edit and Delete Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/edit-book/${book.id}`}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition text-center text-sm font-semibold"
                  >
                    แก้ไข
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id, book.title)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookListPage;