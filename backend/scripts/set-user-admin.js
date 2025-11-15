require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const { ROLES } = require('../src/config/constants');

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/set-user-admin.js <email>');
  process.exit(1);
}

const setUserAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email "${userEmail}" not found`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('\nFound user:');
    console.log('   Email:', user.email);
    console.log('   Current Role:', user.role);
    console.log('   Name:', user.fullName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim());

    // Update role to admin
    user.role = ROLES.ADMIN;
    user.emailVerified = true;
    await user.save();

    console.log('\n✅ User role updated successfully!');
    console.log('   New Role:', user.role);
    console.log('\n🎉 User can now access admin panel');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    process.exit(1);
  }
};

setUserAdmin();
