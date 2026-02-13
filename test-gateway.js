const axios = require('axios');

const GATEWAY_URL = 'http://localhost:4000/graphql';

async function testQuery(query, variables = {}, name) {
    try {
        console.log(`Testing ${name}...`);
        const response = await axios.post(GATEWAY_URL, {
            query,
            variables
        });

        if (response.data.errors) {
            console.error(`❌ ${name} Failed:`, JSON.stringify(response.data.errors, null, 2));
        } else {
            console.log(`✅ ${name} Passed`);
            // console.log(JSON.stringify(response.data.data, null, 2));
        }
    } catch (error) {
        console.error(`❌ ${name} Error:`, error.message);
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function runTests() {
    // 1. Test Products
    const productsQuery = `
        query {
            products(page: 1, limit: 5) {
                _id
                title
                price
                inventory {
                    currentStock
                }
            }
        }
    `;
    await testQuery(productsQuery, {}, 'Products Query');

    // 2. Test Users (Requires Token usually, but assuming public or mock for now)
    // Note: Gateway passes token. If we don't send one, downstream might fail or return 401.
    // We'll skip auth-heavy tests or just try to see if it reaches the service.

    // 3. Test Service Introspection (if enabled) or just basic "Hello" if we had one.
    // We don't have a root hello.
}

runTests();
