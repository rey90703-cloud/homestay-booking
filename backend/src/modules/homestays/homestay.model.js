const mongoose = require('mongoose');
const { HOMESTAY_STATUS } = require('../../config/constants');

const homestaySchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Basic Information
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: 'text',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      index: 'text',
    },
    propertyType: {
      type: String,
      enum: {
        values: ['entire_place', 'private_room', 'shared_room'],
        message: '{VALUE} is not a valid property type',
      },
      required: true,
    },

    // Location
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: String,
      country: {
        type: String,
        required: [true, 'Country is required'],
      },
      zipCode: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: '2dsphere',
        },
      },
    },

    // Capacity & Rooms
    capacity: {
      guests: {
        type: Number,
        required: true,
        min: [1, 'Must accommodate at least 1 guest'],
        max: [16, 'Cannot accommodate more than 16 guests'],
      },
      bedrooms: {
        type: Number,
        required: true,
        min: [0, 'Bedrooms cannot be negative'],
      },
      beds: {
        type: Number,
        required: true,
        min: [1, 'Must have at least 1 bed'],
      },
      bathrooms: {
        type: Number,
        required: true,
        min: [0.5, 'Must have at least 0.5 bathroom'],
      },
    },

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
      weeklyDiscount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      monthlyDiscount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      cleaningFee: {
        type: Number,
        min: 0,
        default: 0,
      },
      serviceFee: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        default: 'VND',
      },
    },

    // Amenities
    amenities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenity',
      },
    ],
    amenityNames: [String], // Denormalized for search

    // Images
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String,
        caption: String,
        order: Number,
      },
    ],
    coverImage: String, // Denormalized from images[0]

    // House Rules
    houseRules: {
      checkInTime: {
        type: String,
        default: '14:00',
      },
      checkOutTime: {
        type: String,
        default: '11:00',
      },
      smokingAllowed: {
        type: Boolean,
        default: false,
      },
      petsAllowed: {
        type: Boolean,
        default: false,
      },
      partiesAllowed: {
        type: Boolean,
        default: false,
      },
      childrenAllowed: {
        type: Boolean,
        default: true,
      },
      minNights: {
        type: Number,
        default: 1,
        min: 1,
      },
      maxNights: {
        type: Number,
        default: 365,
      },
      additionalRules: [String],
    },

    // Availability
    availability: {
      instantBook: {
        type: Boolean,
        default: false,
      },
      advanceNotice: {
        type: Number, // in hours
        default: 24,
      },
      preparationTime: {
        type: Number, // in days
        default: 1,
      },
      unavailableDates: [Date],
    },

    // Status & Verification
    status: {
      type: String,
      enum: Object.values(HOMESTAY_STATUS),
      default: HOMESTAY_STATUS.DRAFT,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,

    // Statistics (Denormalized)
    stats: {
      totalBookings: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      viewCount: {
        type: Number,
        default: 0,
      },
    },

    // Timestamps
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
homestaySchema.index({ hostId: 1, status: 1 });
homestaySchema.index({ 'location.city': 1, status: 1 });
homestaySchema.index({ 'location.country': 1, status: 1 });
homestaySchema.index({ 'location.coordinates': '2dsphere' });
homestaySchema.index({ title: 'text', description: 'text' });
homestaySchema.index({ 'pricing.basePrice': 1 });
homestaySchema.index({ status: 1, verificationStatus: 1 });
homestaySchema.index({ 'stats.averageRating': -1 });
homestaySchema.index({ amenityNames: 1 });
homestaySchema.index({ createdAt: -1 });

// Virtual for total price calculation
homestaySchema.virtual('totalPrice').get(function () {
  return this.pricing.basePrice + this.pricing.cleaningFee + this.pricing.serviceFee;
});

// Pre-save middleware to set cover image (only if not already set)
homestaySchema.pre('save', function (next) {
  if (!this.coverImage && this.images && this.images.length > 0) {
    this.coverImage = this.images[0].url;
  }
  next();
});

// Pre-save middleware to denormalize amenity names
homestaySchema.pre('save', async function (next) {
  if (this.isModified('amenities') && this.amenities.length > 0) {
    const Amenity = mongoose.model('Amenity');
    const amenities = await Amenity.find({ _id: { $in: this.amenities } });
    this.amenityNames = amenities.map((a) => a.name);
  }
  next();
});

// Method to check availability for dates
homestaySchema.methods.isAvailableForDates = function (checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Check if any unavailable date falls within the booking period
  const hasConflict = this.availability.unavailableDates.some((unavailableDate) => {
    const date = new Date(unavailableDate);
    return date >= checkInDate && date <= checkOutDate;
  });

  return !hasConflict;
};

// Method to increment view count
homestaySchema.methods.incrementViewCount = async function () {
  this.stats.viewCount += 1;
  await this.save();
};

const Homestay = mongoose.model('Homestay', homestaySchema);

module.exports = Homestay;
