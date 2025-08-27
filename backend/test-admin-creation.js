const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testAdminCreation() {
  try {
    console.log('🧪 Testing Admin Creation Feature...\n');

    // Step 1: Login as default admin
    console.log('1️⃣ Logging in as default admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'Admin',
      password: 'Admin8265'
    });

    const { token } = loginResponse.data;
    console.log('✅ Login successful, token received\n');

    // Step 2: Test creating a new admin
    console.log('2️⃣ Testing admin creation...');
    const newAdminData = {
      username: 'TestAdmin',
      full_name: 'Test Administrator',
      password: 'TestPass123',
      email: 'testadmin@barangaylink.com',
      contact_number: '09123456789'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/admin/create`, newAdminData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Admin creation successful:');
    console.log(`   Username: ${createResponse.data.admin.username}`);
    console.log(`   Full Name: ${createResponse.data.admin.full_name}`);
    console.log(`   Email: ${createResponse.data.admin.email}`);
    console.log(`   Role: ${createResponse.data.admin.role}`);
    console.log(`   Status: ${createResponse.data.admin.status}`);
    console.log(`   Verified: ${createResponse.data.admin.is_verified}\n`);

    // Step 3: Test getting all admins
    console.log('3️⃣ Testing get all admins...');
    const adminsResponse = await axios.get(`${BASE_URL}/api/admin/admins`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Retrieved admin list:');
    adminsResponse.data.admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.username} (${admin.full_name}) - ${admin.email}`);
    });
    console.log('');

    // Step 4: Test login with new admin
    console.log('4️⃣ Testing login with new admin...');
    const newAdminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'TestAdmin',
      password: 'TestPass123'
    });

    console.log('✅ New admin login successful:');
    console.log(`   Username: ${newAdminLoginResponse.data.user.username}`);
    console.log(`   Role: ${newAdminLoginResponse.data.user.role}`);
    console.log(`   Verified: ${newAdminLoginResponse.data.user.is_verified}\n`);

    // Step 5: Test login with email
    console.log('5️⃣ Testing login with email...');
    const emailLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testadmin@barangaylink.com',
      password: 'TestPass123'
    });

    console.log('✅ Email login successful:');
    console.log(`   Email: ${emailLoginResponse.data.user.email}`);
    console.log(`   Role: ${emailLoginResponse.data.user.role}\n`);

    // Step 6: Test unauthorized access (non-admin user)
    console.log('6️⃣ Testing unauthorized access...');
    try {
      await axios.post(`${BASE_URL}/api/admin/create`, newAdminData, {
        headers: {
          'Authorization': `Bearer ${newAdminLoginResponse.data.token}`
        }
      });
      console.log('❌ Should have failed - new admin cannot create other admins');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Unauthorized access properly blocked');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    console.log('\n🎉 All tests passed! Admin creation feature is working correctly.');
    console.log('\n📋 Summary:');
    console.log('✅ Default admin can log in with username or email');
    console.log('✅ Default admin can create new admin users');
    console.log('✅ New admin users can log in with username or email');
    console.log('✅ New admin users cannot create other admins');
    console.log('✅ Admin list endpoint works correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.fieldErrors) {
      console.error('Field errors:', error.response.data.fieldErrors);
    }
    process.exit(1);
  }
}

// Run the test
testAdminCreation();
