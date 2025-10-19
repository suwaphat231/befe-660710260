import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getById(id);
      setBook(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch book details: ' + err.message);
      console.error('Error fetching book:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    </div>
  );
  if (!book) return <div className="text-center py-12">Book not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
      >
        ← Back
      </button>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {book.cover_image && (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-full rounded-lg shadow-lg"
            />
          )}
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
          
          {book.category && (
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mb-4">
              {book.category}
            </span>
          )}
          
          <div className="flex items-center gap-4 mb-6">
            {book.rating > 0 && (
              <div className="flex items-center">
                <span className="text-yellow-500 text-xl">⭐</span>
                <span className="ml-1 font-semibold">{book.rating}</span>
                {book.reviews_count > 0 && (
                  <span className="ml-1 text-gray-500">
                    ({book.reviews_count} reviews)
                  </span>
                )}
              </div>
            )}
            {book.is_new && (
              <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                NEW
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-green-600">
                ฿{book.price}
              </span>
              {book.discount > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ฿{book.original_price}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded">
                    -{book.discount}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
          
          {book.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {book.isbn && (
              <div>
                <span className="font-semibold">ISBN:</span> {book.isbn}
              </div>
            )}
            {book.year && (
              <div>
                <span className="font-semibold">Year:</span> {book.year}
              </div>
            )}
            {book.pages && (
              <div>
                <span className="font-semibold">Pages:</span> {book.pages}
              </div>
            )}
            {book.language && (
              <div>
                <span className="font-semibold">Language:</span> {book.language}
              </div>
            )}
            {book.publisher && (
              <div className="col-span-2">
                <span className="font-semibold">Publisher:</span> {book.publisher}
              </div>
            )}
          </div>
          
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookDetailPage;