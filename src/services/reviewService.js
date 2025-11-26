import API_BASE_URL from '../config/api';

class ReviewService {
  // Lấy danh sách reviews của một homestay
  async getHomestayReviews(homestayId, options = {}) {
    try {
      const { sort = 'newest', rating = 'all', page = 1, limit = 10 } = options;
      
      const queryParams = new URLSearchParams({
        sort,
        page: page.toString(),
        limit: limit.toString()
      });

      if (rating !== 'all') {
        queryParams.append('rating', rating);
      }

      const response = await fetch(
        `${API_BASE_URL}/homestays/${homestayId}/reviews?${queryParams}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          reviews: data.data || [],
          pagination: data.meta?.pagination || data.pagination
        };
      }
      
      throw new Error(data.message || 'Failed to fetch reviews');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tạo review mới
  async createReview(homestayId, reviewData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/homestays/${homestayId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          review: data.data
        };
      }
      
      throw new Error(data.message || 'Failed to create review');
    } catch (error) {
      console.error('Error creating review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cập nhật review
  async updateReview(reviewId, reviewData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          review: data.data
        };
      }
      
      throw new Error(data.message || 'Failed to update review');
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Xóa review
  async deleteReview(reviewId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true
        };
      }
      
      throw new Error(data.message || 'Failed to delete review');
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Đánh dấu review hữu ích
  async markReviewHelpful(reviewId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          helpfulCount: data.data.helpfulCount
        };
      }
      
      throw new Error(data.message || 'Failed to mark review as helpful');
    } catch (error) {
      console.error('Error marking review helpful:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Trả lời review
  async replyToReview(reviewId, replyData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(replyData)
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          reply: data.data
        };
      }
      
      throw new Error(data.message || 'Failed to reply to review');
    } catch (error) {
      console.error('Error replying to review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Báo cáo review
  async reportReview(reviewId, reason) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true
        };
      }
      
      throw new Error(data.message || 'Failed to report review');
    } catch (error) {
      console.error('Error reporting review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy thống kê reviews
  async getReviewStats(homestayId) {
    try {
      const response = await fetch(`${API_BASE_URL}/homestays/${homestayId}/reviews/stats`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          stats: data.data || data
        };
      }
      
      throw new Error(data.message || 'Failed to fetch review stats');
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user can review
  async canUserReview(homestayId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const response = await fetch(`${API_BASE_URL}/homestays/${homestayId}/can-review`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const data = await response.json();
      
      return {
        success: data.success,
        data: data.data
      };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate review data
  validateReviewData(reviewData) {
    const errors = [];

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      errors.push('Comment must be at least 10 characters long');
    }

    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.push('Comment must be less than 1000 characters');
    }

    if (reviewData.title && reviewData.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    // Validate category ratings
    if (reviewData.categories) {
      const validCategories = ['cleanliness', 'accuracy', 'checkIn', 'communication', 'location', 'value'];
      
      for (const [category, rating] of Object.entries(reviewData.categories)) {
        if (!validCategories.includes(category)) {
          errors.push(`Invalid category: ${category}`);
        }
        
        if (rating < 1 || rating > 5) {
          errors.push(`Category ${category} rating must be between 1 and 5`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format review data for display
  formatReviewForDisplay(review) {
    return {
      ...review,
      formattedDate: new Date(review.createdAt || review.date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      userInitial: review.user?.name?.charAt(0)?.toUpperCase() || 'U',
      isRecent: this.isRecentReview(review.createdAt || review.date)
    };
  }

  // Check if review is recent (within 7 days)
  isRecentReview(dateString) {
    const reviewDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  // Calculate average rating from categories
  calculateAverageRating(categories) {
    if (!categories || Object.keys(categories).length === 0) {
      return 0;
    }

    const ratings = Object.values(categories);
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
  }
}

export default new ReviewService();