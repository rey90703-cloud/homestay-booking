const mongoose = require('mongoose');
const Homestay = require('../src/modules/homestays/homestay.model');
const User = require('../src/modules/users/user.model');
require('dotenv').config();

const homestaysData = [
  // HÀ NỘI - 4 homestays
  {
    title: 'Căn hộ studio hiện đại trung tâm Hà Nội',
    description: 'Studio nhỏ gọn, tiện nghi đầy đủ tại quận Hoàn Kiếm. Gần Hồ Gươm, phố cổ, các quán cafe và nhà hàng. Phù hợp cho khách du lịch một mình hoặc cặp đôi. Có thang máy, wifi tốc độ cao, điều hòa, tủ lạnh.',
    propertyType: 'entire_place',
    location: {
      address: '78 Hàng Bông, Hoàn Kiếm',
      city: 'Hà Nội',
      state: 'Hà Nội',
      country: 'Vietnam',
      zipCode: '100000',
      coordinates: {
        type: 'Point',
        coordinates: [105.8542, 21.0285]
      }
    },
    capacity: {
      guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    pricing: {
      basePrice: 800000,
      cleaningFee: 100000,
      serviceFee: 80000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 1,
      maxNights: 30
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 156,
      totalReviews: 134,
      averageRating: 4.6,
      viewCount: 4560
    }
  },
  {
    title: 'Nhà phố cổ kính 3 tầng gần Hồ Tây',
    description: 'Ngôi nhà phố kiến trúc Pháp cổ kính, được cải tạo hiện đại. 3 tầng rộng rãi, sân thượng view Hồ Tây. Gần chùa Trấn Quốc, đường Thanh Niên. Phù hợp cho gia đình hoặc nhóm bạn. Có bếp đầy đủ, phòng khách rộng.',
    propertyType: 'entire_place',
    location: {
      address: '45 Yên Phụ, Tây Hồ',
      city: 'Hà Nội',
      state: 'Hà Nội',
      country: 'Vietnam',
      zipCode: '100000',
      coordinates: {
        type: 'Point',
        coordinates: [105.8342, 21.0583]
      }
    },
    capacity: {
      guests: 8,
      bedrooms: 4,
      beds: 5,
      bathrooms: 3
    },
    pricing: {
      basePrice: 2500000,
      cleaningFee: 300000,
      serviceFee: 200000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: true,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 2,
      maxNights: 60
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 89,
      totalReviews: 72,
      averageRating: 4.8,
      viewCount: 2890
    }
  },
  {
    title: 'Căn hộ 2 phòng ngủ view Hồ Gươm',
    description: 'Căn hộ cao cấp tầm nhìn trực diện Hồ Hoàn Kiếm. Nội thất sang trọng, đầy đủ tiện nghi 5 sao. Gần Nhà hát Lớn, Bảo tàng Lịch sử. Lý tưởng cho gia đình nhỏ hoặc cặp đôi muốn trải nghiệm phố cổ Hà Nội.',
    propertyType: 'entire_place',
    location: {
      address: '12 Lê Thái Tổ, Hoàn Kiếm',
      city: 'Hà Nội',
      state: 'Hà Nội',
      country: 'Vietnam',
      zipCode: '100000',
      coordinates: {
        type: 'Point',
        coordinates: [105.8520, 21.0278]
      }
    },
    capacity: {
      guests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2
    },
    pricing: {
      basePrice: 1800000,
      cleaningFee: 200000,
      serviceFee: 150000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 2,
      maxNights: 30
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 112,
      totalReviews: 95,
      averageRating: 4.9,
      viewCount: 3450
    }
  },
  {
    title: 'Phòng riêng ấm cúng trong villa Tây Hồ',
    description: 'Phòng riêng trong villa sang trọng khu Tây Hồ. Không gian yên tĩnh, view hồ đẹp. Chủ nhà thân thiện, nhiệt tình. Gần các quán cafe, nhà hàng Tây. Phù hợp cho khách du lịch một mình hoặc cặp đôi.',
    propertyType: 'private_room',
    location: {
      address: '89 Quảng An, Tây Hồ',
      city: 'Hà Nội',
      state: 'Hà Nội',
      country: 'Vietnam',
      zipCode: '100000',
      coordinates: {
        type: 'Point',
        coordinates: [105.8245, 21.0650]
      }
    },
    capacity: {
      guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    pricing: {
      basePrice: 600000,
      cleaningFee: 80000,
      serviceFee: 60000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 1,
      maxNights: 14
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 145,
      totalReviews: 118,
      averageRating: 4.7,
      viewCount: 2670
    }
  },

  // LÀO CAI - 4 homestays
  {
    title: 'Homestay gia đình người H\'Mông tại Sapa',
    description: 'Trải nghiệm văn hóa bản địa cùng gia đình người H\'Mông. Nhà gỗ truyền thống, view ruộng bậc thang tuyệt đẹp. Thưởng thức món ăn dân tộc, tham gia sinh hoạt cộng đồng. Chủ nhà thân thiện, nhiệt tình hướng dẫn trekking.',
    propertyType: 'private_room',
    location: {
      address: 'Bản Cát Cát, Sapa',
      city: 'Lào Cai',
      state: 'Lào Cai',
      country: 'Vietnam',
      zipCode: '330000',
      coordinates: {
        type: 'Point',
        coordinates: [103.8409, 22.3364]
      }
    },
    capacity: {
      guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    pricing: {
      basePrice: 400000,
      cleaningFee: 50000,
      serviceFee: 40000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 1,
      maxNights: 7
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 178,
      totalReviews: 156,
      averageRating: 4.9,
      viewCount: 4230
    }
  },
  {
    title: 'Villa view núi Fansipan tại Sapa',
    description: 'Villa sang trọng với tầm nhìn toàn cảnh núi Fansipan. Kiến trúc hiện đại kết hợp phong cách Tây Bắc. Sân vườn rộng, lò sưởi ấm áp. Gần trung tâm Sapa, cáp treo Fansipan. Lý tưởng cho gia đình hoặc nhóm bạn.',
    propertyType: 'entire_place',
    location: {
      address: 'Đường Hoàng Liên, Sapa',
      city: 'Lào Cai',
      state: 'Lào Cai',
      country: 'Vietnam',
      zipCode: '330000',
      coordinates: {
        type: 'Point',
        coordinates: [103.8440, 22.3380]
      }
    },
    capacity: {
      guests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2
    },
    pricing: {
      basePrice: 2200000,
      cleaningFee: 250000,
      serviceFee: 180000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      smokingAllowed: false,
      petsAllowed: true,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 2,
      maxNights: 30
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 92,
      totalReviews: 78,
      averageRating: 4.8,
      viewCount: 2980
    }
  },
  {
    title: 'Nhà gỗ ấm áp giữa rừng thông Sapa',
    description: 'Ngôi nhà gỗ nhỏ xinh nằm giữa rừng thông xanh mát. Không gian yên tĩnh, riêng tư, lý tưởng để thư giãn. Có lò sưởi, bếp đầy đủ, ban công view rừng thông. Cách trung tâm Sapa 10 phút lái xe. Phù hợp cho cặp đôi hoặc gia đình nhỏ.',
    propertyType: 'entire_place',
    location: {
      address: 'Đường Trần Quốc Toản, Sapa',
      city: 'Lào Cai',
      state: 'Lào Cai',
      country: 'Vietnam',
      zipCode: '330000',
      coordinates: {
        type: 'Point',
        coordinates: [103.8583, 22.3333]
      }
    },
    capacity: {
      guests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1
    },
    pricing: {
      basePrice: 1200000,
      cleaningFee: 150000,
      serviceFee: 100000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 1,
      maxNights: 14
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 134,
      totalReviews: 112,
      averageRating: 4.7,
      viewCount: 3120
    }
  },
  {
    title: 'Bungalow view thung lũng Mường Hoa',
    description: 'Bungalow độc lập với view thung lũng Mường Hoa tuyệt đẹp. Thiết kế hiện đại, nội thất gỗ ấm cúng. Ban công riêng ngắm hoàng hôn, sân vườn nhỏ. Gần bản Tả Van, Lao Chải. Trải nghiệm yên bình giữa thiên nhiên núi rừng Tây Bắc.',
    propertyType: 'entire_place',
    location: {
      address: 'Thung lũng Mường Hoa, Sapa',
      city: 'Lào Cai',
      state: 'Lào Cai',
      country: 'Vietnam',
      zipCode: '330000',
      coordinates: {
        type: 'Point',
        coordinates: [103.8650, 22.3250]
      }
    },
    capacity: {
      guests: 3,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1
    },
    pricing: {
      basePrice: 1500000,
      cleaningFee: 180000,
      serviceFee: 120000,
      currency: 'VND'
    },
    houseRules: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      childrenAllowed: true,
      minNights: 2,
      maxNights: 21
    },
    status: 'active',
    verificationStatus: 'approved',
    stats: {
      totalBookings: 87,
      totalReviews: 71,
      averageRating: 4.9,
      viewCount: 2450
    }
  }
];

async function seedHomestays() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user or create one
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating a default admin...');
      adminUser = await User.create({
        email: 'admin@homestay.com',
        password: 'Admin@123456',
        role: 'admin',
        fullName: 'Admin Homestay',
        profile: {
          firstName: 'Admin',
          lastName: 'Homestay',
          phone: '0987654321'
        },
        emailVerified: true
      });
      console.log('✅ Created default admin user');
    }

    console.log(`📍 Using admin: ${adminUser.email} (${adminUser._id})`);

    // Add hostId (admin) to all homestays
    const homestaysWithHost = homestaysData.map(homestay => ({
      ...homestay,
      hostId: adminUser._id,
      publishedAt: new Date()
    }));

    // Clear existing homestays (optional - comment out if you want to keep existing data)
    // await Homestay.deleteMany({});
    // console.log('🗑️  Cleared existing homestays');

    // Insert homestays
    const result = await Homestay.insertMany(homestaysWithHost);
    console.log(`✅ Successfully added ${result.length} homestays to database`);

    // Display summary
    console.log('\n📊 Summary:');
    result.forEach((homestay, index) => {
      console.log(`${index + 1}. ${homestay.title}`);
      console.log(`   📍 ${homestay.location.city}`);
      console.log(`   💰 ${homestay.pricing.basePrice.toLocaleString('vi-VN')} VND/đêm`);
      console.log(`   ⭐ ${homestay.stats.averageRating}/5 (${homestay.stats.totalReviews} reviews)`);
      console.log('');
    });

    console.log('✨ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding homestays:', error);
    process.exit(1);
  }
}

// Run the seed function
seedHomestays();

