const BASE_URL = 'http://localhost:3005/api/v1';

const testProduct = {
    title: "Test Product",
    price: 100
};

const testCategory = {
    name: "Test Category",
    description: "Category for testing"
};

const testBrand = {
    name: "Test Brand",
    description: "Brand for testing"
};

const verifyService = async () => {
    try {
        console.log("Starting Verification...");

        // Helper for fetch
        const request = async (url, method = 'GET', body = null) => {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (body) options.body = JSON.stringify(body);

            const res = await fetch(url, options);
            const data = await res.json();

            if (!res.ok) {
                const error = new Error(data.message || `Request failed with status ${res.status}`);
                error.response = { status: res.status, data };
                throw error;
            }
            return data;
        };

        // --- PRODUCT ---
        console.log("\n--- Product Verification ---");
        const createProdRes = await request(`${BASE_URL}/products`, 'POST', testProduct);
        const productId = createProdRes.data._id;
        console.log("Created Product:", productId);
        await request(`${BASE_URL}/products`);

        // --- CATEGORY ---
        console.log("\n--- Category Verification ---");
        const createCatRes = await request(`${BASE_URL}/categories`, 'POST', testCategory);
        const categoryId = createCatRes.data._id;
        console.log("Created Category:", categoryId);
        await request(`${BASE_URL}/categories`);

        // --- BRAND ---
        console.log("\n--- Brand Verification ---");
        const createBrandRes = await request(`${BASE_URL}/brands`, 'POST', testBrand);
        const brandId = createBrandRes.data._id;
        console.log("Created Brand:", brandId);
        await request(`${BASE_URL}/brands`);

        // --- VARIANT ---
        console.log("\n--- Variant Verification ---");
        const testVariant = {
            productId: productId,
            price: 50,
            sku: `SKU-${Date.now()}`
        };
        const createVarRes = await request(`${BASE_URL}/variants`, 'POST', testVariant);
        const variantId = createVarRes.data._id;
        console.log("Created Variant:", variantId);

        const getVariantRes = await request(`${BASE_URL}/variants/${variantId}`);
        if (getVariantRes.data.productId.title !== testProduct.title) {
            throw new Error("Variant population failed");
        }
        console.log("Variant Population Verified");

        // CLEANUP
        console.log("\n--- Cleanup ---");
        await request(`${BASE_URL}/products/${productId}`, 'DELETE');
        await request(`${BASE_URL}/categories/${categoryId}`, 'DELETE');
        await request(`${BASE_URL}/brands/${brandId}`, 'DELETE');
        await request(`${BASE_URL}/variants/${variantId}`, 'DELETE');

        console.log("\nVerification Successful!");
    } catch (error) {
        console.error("\nVerification Failed:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
};

verifyService();
