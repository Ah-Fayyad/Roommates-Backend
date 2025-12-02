const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let listingId = '';

async function runVerification() {
    try {
        console.log('Starting API Verification...');

        // 1. Signup/Login
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`Creating user: ${email}`);
        
        try {
            const signupRes = await axios.post(`${API_URL}/auth/signup`, {
                email,
                password,
                fullName: 'Test User',
                role: 'TENANT'
            });
            token = signupRes.data.token;
            userId = signupRes.data.user.id;
            console.log('✅ Signup successful');
        } catch (e) {
            console.error('Signup failed:', e.response?.data || e.message);
            return;
        }

        // 2. Create a Listing (we need one to visit/report)
        // We need a landlord user for this, or we can try to find an existing one.
        // Let's create a landlord first.
        let landlordToken = '';
        try {
            const landlordEmail = `landlord${Date.now()}@example.com`;
            const landlordRes = await axios.post(`${API_URL}/auth/signup`, {
                email: landlordEmail,
                password: 'password123',
                fullName: 'Landlord User',
                role: 'LANDLORD'
            });
            landlordToken = landlordRes.data.token;
            console.log('✅ Landlord signup successful');

            const listingRes = await axios.post(`${API_URL}/listings`, {
                title: 'Test Listing',
                description: 'A test listing for verification',
                price: 1000,
                address: '123 Test St',
                city: 'Test City',
                type: 'APARTMENT',
                images: [],
                amenities: ['Wifi'],
                latitude: 0,
                longitude: 0
            }, {
                headers: { Authorization: `Bearer ${landlordToken}` }
            });
            listingId = listingRes.data.id;
            console.log('✅ Listing created successful');
        } catch (e) {
            console.error('Listing creation failed:', e.response?.data || e.message);
            return;
        }

        // 3. Request Visit
        try {
            await axios.post(`${API_URL}/visits/request`, {
                listingId,
                proposedTimes: [new Date().toISOString()],
                message: 'I want to visit'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Visit request successful');
        } catch (e) {
            console.error('Visit request failed:', e.response?.data || e.message);
        }

        // 4. Report Listing
        try {
            await axios.post(`${API_URL}/reports`, {
                targetId: listingId,
                targetType: 'LISTING',
                reason: 'OTHER',
                description: 'Test report'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Report listing successful');
        } catch (e) {
            console.error('Report listing failed:', e.response?.data || e.message);
        }

        // 5. Get Notifications (Landlord should have one from visit request)
        try {
            const notifRes = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${landlordToken}` }
            });
            if (notifRes.data.length > 0) {
                console.log(`✅ Notifications fetched successful (${notifRes.data.length} found)`);
            } else {
                console.warn('⚠️ No notifications found for landlord (expected at least 1)');
            }
        } catch (e) {
            console.error('Get notifications failed:', e.response?.data || e.message);
        }

        console.log('API Verification Completed.');

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

runVerification();
