import React from 'react';
import { Link } from 'react-router-dom';

function FeaturedBooks({ books = [] }) {
  // ตรวจสอบว่า books เป็น array
  if (!Array.isArray(books)) {
    console.error('❌ FeaturedBooks: books is not an array:', books);
    return null;
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">ไม่พบหนังสือแนะนำในขณะนี้</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <Link
          key={book.id}
          to={`/books/${book.id}`}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
        >
          <div className="relative overflow-hidden">
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder.jpg';
                }}
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
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2">{book.author}</p>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-green-600 font-bold text-xl">฿{book.price}</span>
                {book.original_price && book.discount > 0 && (
                  <span className="text-gray-400 line-through text-sm ml-2">
                    ฿{book.original_price}
                  </span>
                )}
              </div>
              {book.rating && (
                <div className="flex items-center text-yellow-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm text-gray-700">{book.rating}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default FeaturedBooks;