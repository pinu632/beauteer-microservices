const axios = require('axios');

const SERVICES = {
    CART: 'http://localhost:3005/api/v1',
    NOTIFICATION: 'http://localhost:3006/api/v1',
    FULFILLMENT: 'http://localhost:3008/api/v1',
    SUPPORT: 'http://localhost:3009/api/v1',
    INVENTORY: 'http://localhost:3010/api/v1',
    SELLER: 'http://localhost:3007/api/v1',
    PAYMENT: 'http://localhost:3004/api/v1'
};

const testEndpoint = async (serviceName, url, method = 'GET', data = null) => {
    try {
        console.log(`Testing ${serviceName} ${method} ${url}...`);
        const response = await axios({ method, url, data });
        console.log(`✅ ${serviceName} Passed: ${response.status}`);
    } catch (error) {
        console.error(`❌ ${serviceName} Failed: ${error.message}`);
        if (error.response) console.error(error.response.data);
    }
};

const runTests = async () => {
    // 1. Cart
    await testEndpoint('CART', `${SERVICES.CART}/cart/test-user-id`);

    // 2. Notification
    await testEndpoint('NOTIFICATION', `${SERVICES.NOTIFICATION}/notifications`);

    // 3. Fulfillment
    // Using a dummy order ID
    await testEndpoint('FULFILLMENT', `${SERVICES.FULFILLMENT}/shipments/order/dummy-order-id`);
    // Testing the ID endpoint would require a valid ID, skipping for generic check or using a known one if created.

    // 4. Support
    await testEndpoint('SUPPORT', `${SERVICES.SUPPORT}/tickets`);

    // 5. Inventory
    await testEndpoint('INVENTORY', `${SERVICES.INVENTORY}/inventory/product/dummy-product-id`);

    // 6. Seller
    await testEndpoint('SELLER', `${SERVICES.SELLER}/sellers/dummy-seller-id`);

    // 7. Payment
    await testEndpoint('PAYMENT', `${SERVICES.PAYMENT}/payments/order/dummy-order-id`);
};

runTests();
