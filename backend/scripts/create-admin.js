require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const { ROLES } = require('../src/config/constants');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@homestay.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      // Update password if needed
      existingAdmin.password = 'Admin@123456';
      existingAdmin.emailVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin password has been reset to: Admin@123456');
      
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@homestay.com',
      password: 'Admin@123456',
      role: ROLES.ADMIN,
      emailVerified: true,
      profile: {
        firstName: 'Admin',
        lastName: 'System',
        phone: '0123456789',
      },
      fullName: 'Admin System',
      accountStatus: 'active',
    });

    await adminUser.save();

    console.log('✅ Admin account created successfully!');
    console.log('\nLogin credentials:');
    console.log('   Email: admin@homestay.com');
    console.log('   Password: Admin@123456');
    console.log('\n🔒 Please change the password after first login');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
