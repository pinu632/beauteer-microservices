
const BASE_URL = 'http://localhost:3001/api/v1';

async function testAddress() {
    try {
        const randomEmail = `test${Date.now()}@example.com`;
        const password = 'password123';

        // 0. Register User first to ensure we have one
        console.log(`Registering user ${randomEmail}...`);
        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: randomEmail,
                password: password,
                phone: '1234567890'
            })
        });

        let token;
        if (registerRes.ok) {
            const regData = await registerRes.json();
            token = regData.accessToken;
            console.log('Registered successfully.');
        } else {
            console.log('Registration failed, trying login...');
            // 1. Login to get token if registration failed (maybe user exists)
            const loginRes = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: randomEmail,
                    password: password
                })
            });

            if (!loginRes.ok) {
                const err = await loginRes.json();
                throw new Error(`Login failed: ${err.message}`);
            }

            const loginData = await loginRes.json();
            token = loginData.accessToken;
            console.log('Logged in successfully.');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Add Address
        console.log('Adding address...');
        const addressData = {
            fullName: 'Test User',
            phone: '1234567890',
            addressLine1: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            pincode: '123456',
            type: 'home'
        };

        const addRes = await fetch(`${BASE_URL}/addresses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(addressData)
        });

        if (!addRes.ok) {
            const err = await addRes.json();
            throw new Error(`Add address failed: ${err.message}`);
        }

        const addData = await addRes.json();
        console.log('Address added:', addData.address._id);
        const addressId = addData.address._id;

        // 3. Get All Addresses
        console.log('Fetching all addresses...');
        const getAllRes = await fetch(`${BASE_URL}/addresses`, {
            method: 'GET',
            headers
        });

        if (!getAllRes.ok) {
            const err = await getAllRes.json();
            throw new Error(`Get all addresses failed: ${err.message}`);
        }

        const getAllData = await getAllRes.json();
        console.log('Addresses count:', getAllData.addresses.length);
        console.log('Addresses:', JSON.stringify(getAllData.addresses, null, 2));

        // 4. Update Address
        console.log('Updating address...');
        const updateRes = await fetch(`${BASE_URL}/addresses/${addressId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ city: 'Updated City' })
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(`Update address failed: ${err.message}`);
        }

        const updateData = await updateRes.json();
        console.log('Address updated:', updateData.address.city);

        // 5. Delete Address
        console.log('Deleting address...');
        const deleteRes = await fetch(`${BASE_URL}/addresses/${addressId}`, {
            method: 'DELETE',
            headers
        });

        if (!deleteRes.ok) {
            const err = await deleteRes.json();
            throw new Error(`Delete address failed: ${err.message}`);
        }

        console.log('Address deleted.');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAddress();
