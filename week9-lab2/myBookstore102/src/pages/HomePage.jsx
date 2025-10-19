import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksAPI } from '../services/api';
import FeaturedBooks from '../components/FeaturedBooks';
import Newbooks from '../components/Newbooks';
import LoadingSpinner from '../components/LoadingSpinner';

function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [discountedBooks, setDiscountedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [featuredRes, newRes, discountedRes] = await Promise.all([
        booksAPI.getFeatured(8),
        booksAPI.getNew(),
        booksAPI.getDiscounted(),
      ]);

      setFeaturedBooks(featuredRes.data || []);
      setNewBooks(newRes.data || []);
      setDiscountedBooks(discountedRes.data || []);
      
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-xl">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            ยินดีต้อนรับสู่ <span className="text-yellow-300">BookStore</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            ค้นพบหนังสือที่คุณรัก จากห้องสลักจินมากกว่า 10,000 เล่ม
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/books"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg inline-flex items-center justify-center"
            >
              เลือกซื้อหนังสือ
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/about"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition shadow-lg"
            >
              ดูหมวดหมู่ทั้งหมด
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">หนังสือแนะนำ</h2>
            <p className="text-gray-600">คัดสรรหนังสือที่คุณรัก เรตติ้งดีที่สุด</p>
          </div>
          <Link to="/books" className="text-green-600 hover:text-green-700 font-semibold flex items-center transition">
            ดูทั้งหมด
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <FeaturedBooks books={featuredBooks} />
      </section>

      {/* New Books */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">หนังสือใหม่</h2>
              <p className="text-gray-600">หนังสือเข้าใหม่ล่าสุด อัพเดททุกวัน</p>
            </div>
            <Link to="/books" className="text-green-600 hover:text-green-700 font-semibold flex items-center transition">
              ดูทั้งหมด
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <Newbooks books={newBooks} />
        </div>
      </section>

      {/* Discounted Books */}
      {discountedBooks && discountedBooks.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                <span className="text-red-600">🔥</span> ลดราคาพิเศษ
              </h2>
              <p className="text-gray-600">หนังสือลดราคา ราคาพิเศษสุดคุ้ม</p>
            </div>
            <Link to="/books" className="text-green-600 hover:text-green-700 font-semibold flex items-center transition">
              ดูทั้งหมด
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {discountedBooks.slice(0, 8).map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={book.cover_image || '/images/placeholder.jpg'}
                    alt={book.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {book.discount > 0 && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{book.discount}%
                    </span>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-green-600 font-bold text-xl">฿{book.price}</span>
                      {book.original_price && (
                        <span className="text-gray-400 line-through text-sm ml-2">
                          ฿{book.original_price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">พร้อมที่จะเริ่มอ่านหนังสือแล้วหรือยัง?</h2>
          <p className="text-xl mb-8">
            สำรวจคอลเลกชันหนังสือมากมายของเรา และค้นหาหนังสือเล่มโปรดของคุณวันนี้
          </p>
          <Link
            to="/books"
            className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg inline-flex items-center"
          >
            เริ่มช้อปปิ้งเลย
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;