const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const User = require('../src/modules/users/user.model');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'hathu844884@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 User Data:');
    console.log('Email:', user.email);
    console.log('Full Name:', user.fullName);
    console.log('Role:', user.role);
    console.log('Profile:', JSON.stringify(user.profile, null, 2));
    console.log('Avatar:', user.avatar ? 'Yes' : 'No');
    console.log('Last Login:', user.lastLogin);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();

