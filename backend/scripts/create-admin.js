const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');

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
      console.log('Account Status:', existingAdmin.accountStatus);
      
      // Update password if needed
      existingAdmin.password = 'Admin@123456';
      existingAdmin.accountStatus = 'active';
      existingAdmin.emailVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin password updated to: Admin@123456');
    } else {
      // Create new admin
      const admin = new User({
        email: 'admin@homestay.com',
        password: 'Admin@123456',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'System',
          phone: '0123456789',
        },
        emailVerified: true,
        accountStatus: 'active',
      });

      await admin.save();
      console.log('✅ Admin account created successfully!');
      console.log('Email: admin@homestay.com');
      console.log('Password: Admin@123456');
    }

    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
