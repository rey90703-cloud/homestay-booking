const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    icon: String,
    category: {
      type: String,
      enum: ['basic', 'features', 'location', 'safety'],
      default: 'basic',
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
amenitySchema.index({ name: 1 }, { unique: true });
amenitySchema.index({ slug: 1 }, { unique: true });
amenitySchema.index({ category: 1, isActive: 1 });

// Generate slug before saving
amenitySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Amenity = mongoose.model('Amenity', amenitySchema);

module.exports = Amenity;
