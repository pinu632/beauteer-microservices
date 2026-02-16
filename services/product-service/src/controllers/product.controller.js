import productHelper from "../helpers/product.helper.js";
import categoryHelper from "../helpers/category.helper.js";
import brandHelper from "../helpers/brand.helper.js";
import { SellerCache } from "../models/sellerCache.model.js";
import { getChannel } from "../utils/rabbitmq.js";
import { InventoryCache } from "../models/inventoryCache.model.js";
// import inventoryHelper from "../helpers/inventory.helper.js"; // Inventory handling moved to separate service

export const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            categoryId,
            sellerId,
            brandId,
            tags,
            ingredients,
            skinType,
            howToUse,
            isActive,
            price,
            discountPrice,
            inventoryId,
            images
        } = req.body;

        // Validate Category
        if (categoryId) {
            try {
                await categoryHelper.getObjectById({ id: categoryId });
            } catch (error) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
        }

        // Validate Brand
        if (brandId) {
            try {
                await brandHelper.getObjectById({ id: brandId });
            } catch (error) {
                return res.status(400).json({ message: "Invalid brand ID" });
            }
        }

        const productData = {
            title,
            description,
            categoryId,
            brandId,
            sellerId,
            tags,
            ingredients,
            skinType,
            howToUse,
            isActive,
            price,
            discountPrice,
            inventoryId,
            images
        };

        const product = await productHelper.addObject(productData);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bulkCreateProducts = async (req, res) => {
    try {
        const products = await productHelper.insertMany(req.body);
        res.status(201).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getProductByQuery = async (req, res) => {
    try {

        const {
            filter,
            pageNum = 1,
            pageSize = 10,
            sort,

        } = req.body;

        let query = { pageNum, pageSize };

        if (filter) {
            query = {
                ...filter
            }
        }
        if (sort) {
            query = {
                ...query,
                sort
            }
        }

        const populatedQuery = [
            { path: "categoryId", select: "name" },
            { path: "brandId", select: "name" },

        ];

        const products = await productHelper.getAllObjects({
            query,
            populatedQuery,

        });

        const sellerIds = [...new Set(products.map(product => product.sellerId))];
        const sellerDetails = await SellerCache.find({ sellerId: { $in: sellerIds } });

        const sellerMap = {};
        sellerDetails.forEach(s => {
            sellerMap[s.sellerId] = s;
        });

        // Step 4: Attach seller details
        const productsWithSellerDetails = products.map(product => {
            const seller = sellerMap[product.sellerId];

            return {
                ...product,
                seller: seller ? {
                    storeName: seller.storeName,
                    address: seller.address
                } : null
            };
        });

        // Note: Inventory fetching logic disabled as it resides in a separate service now.
        // const inventory = await inventoryHelper.getAllObjects({ query: { productId: products._id } }); 

        res.status(200).json(productsWithSellerDetails);



    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getProducts = async (req, res) => {
    try {
        const { category, brand, price, search, sort, filter } = req.query;
        let query = {};



        if (filter) {
            query = {
                ...filter
            }
        }

        // Search
        if (search) {

            const isBrand = await brandHelper.getObjectByQuery({ query: { slug: { $regex: search, $options: 'i' } } });
            if (isBrand) {
                console.log(isBrand)
                query.brandId = isBrand._id;
            }

            const isCategory = await categoryHelper.getObjectByQuery({ query: { name: { $regex: search, $options: 'i' } } });
            if (isCategory) {
                query.categoryId = isCategory._id;
            }

            if (!query.brandId && !query.categoryId) {
                const searchableFields = ['title', 'description', 'tags', 'ingredients', 'skinType', 'howToUse'];
                const orConditions = searchableFields.map(field => ({ [field]: { $regex: search, $options: "i" } }));
                query.$or = orConditions;
            }

        }

        // Category Filter (support multiple)
        if (category) {
            query.categoryId = { $in: Array.isArray(category) ? category : [category] };
        }

        // Brand Filter (support multiple)
        if (brand) {
            query.brandId = { $in: Array.isArray(brand) ? brand : [brand] };
        }

        // Price Filter
        if (price) {
            query.price = {};
            if (price.gte) query.price.$gte = Number(price.gte);
            if (price.lte) query.price.$lte = Number(price.lte);
        }

        // Sorting
        let sortBy = { createdAt: -1 }; // Default: Newest First
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            sortBy = { [sortField]: sortOrder };
        }

        // Populate category and brand
        const populatedQuery = [
            { path: "categoryId", select: "name" },
            { path: "brandId", select: "name" },

        ];

        console.log(JSON.stringify(query, null, 2));

        const products = await productHelper.getAllObjects({
            query,
            populatedQuery,
            sortBy
        });

        const sellerIds = [...new Set(products.map(product => product.sellerId))];
        const sellerDetails = await SellerCache.find({ sellerId: { $in: sellerIds } });

        const inventoryIds = [...new Set(products.map(product => product._id))];
        const inventoryDetails = await InventoryCache.find({ productId: { $in: inventoryIds } });

        const sellerMap = {};
        sellerDetails.forEach(s => {
            sellerMap[s.sellerId] = s;
        });

        const inventoryMap = {};
        inventoryDetails.forEach(i => {
            inventoryMap[i.productId] = i;
        });

        // Step 4: Attach seller details
        const productsWithSellerDetails = products.map(product => {
            const seller = sellerMap[product.sellerId];
            const inventory = inventoryMap[product._id];

            return {
                ...product,
                seller: seller ? {
                    storeName: seller.storeName,
                    address: seller.address
                } : null,
                inventory: inventory ? {
                    currentStock: inventory.currentStock,
                    reservedStock: inventory.reservedStock,
                    warehouseLocation: inventory.warehouseLocation
                } : null
            };
        });

        // Note: Inventory fetching logic disabled as it resides in a separate service now.
        // const inventory = await inventoryHelper.getAllObjects({ query: { productId: products._id } }); 

        res.status(200).json(productsWithSellerDetails);
    } catch (error) {

        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const populatedQuery = [
            { path: "categoryId", select: "name" },
            { path: "brandId", select: "name" },
        ];

        const product = await productHelper.getObjectById({
            id: req.params.id,
            populatedQuery
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const seller = await SellerCache.findOne({ sellerId: product.sellerId });
        console.log(seller);
        const inventory = await InventoryCache.findOne({ productId: product._id });

        const productWithDetails = {
            ...product,
            seller: seller ? {
                storeName: seller.storeName,
                address: seller.address
            } : null,
            inventory: inventory ? {
                currentStock: inventory.currentStock,
                reservedStock: inventory.reservedStock,
                warehouseLocation: inventory.warehouseLocation
            } : null
        };

        res.status(200).json(productWithDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const updateProduct = async (req, res) => {
    try {
        // Fetch current product to check price
        const currentProduct = await productHelper.getObjectById({ id: req.params.id });
        const oldPrice = currentProduct.discountPrice || currentProduct.price;

        const product = await productHelper.updateObject(req.params.id, req.body);

        const newPrice = product.discountPrice || product.price;

        // Check for Price Drop
        // Only trigger if price significantly dropped (e.g. > 0)
        // And if product is active
        if (product.isActive && newPrice < oldPrice) {
            console.log(`📉 Price Drop Detected for ${product.title}: ${oldPrice} -> ${newPrice}`);

            const channel = getChannel();
            if (channel) {
                const queue = "notification_queue";
                await channel.assertQueue(queue, { durable: true });

                const eventData = {
                    productId: product._id,
                    productTitle: product.title,
                    productImage: product.images && product.images.length > 0 ? product.images[0] : "",
                    oldPrice,
                    newPrice,
                    dropAmount: oldPrice - newPrice,
                    timestamp: new Date()
                };

                channel.sendToQueue(queue, Buffer.from(JSON.stringify({
                    event: "PRICE_DROP_WISHLIST",
                    data: eventData
                })));
            }
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await productHelper.deleteObjectById(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { pageNum, pageSize } = req.query;
        const products = await productHelper.getAllObjects({
            query: { categoryId },
            pageNum,
            pageSize,
            sortBy: { ratingAverage: -1 },
            populatedQuery: [{ path: "categoryId" }, { path: "brandId" }]
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const pipeline = [
            { $match: { isActive: true } },
            { $sort: { ratingAverage: -1 } },
            {
                $group: {
                    _id: "$categoryId",
                    product: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $lookup: {
                    from: "brands",
                    localField: "product.brandId",
                    foreignField: "_id",
                    as: "brandInfo"
                }
            },
            {
                $unwind: {
                    path: "$brandInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$categoryInfo.name",
                    product: {
                        _id: "$product._id",
                        title: "$product.title",
                        brand: "$brandInfo.name",
                        images: "$product.images",
                        rating: "$product.ratingAverage",
                        ratingCount: "$product.ratingCount",
                        price: "$product.price"
                    }
                }
            }
        ];

        const products = await productHelper.aggregate(pipeline);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPopularProducts = async (req, res) => {
    try {
        let { pageNum = 1, pageSize = 10 } = req.query;
        pageNum = parseInt(pageNum);
        pageSize = parseInt(pageSize);

        const pipeline = [
            { $match: { isActive: true } },
            {
                $setWindowFields: {
                    partitionBy: "$categoryId",
                    sortBy: { ratingAverage: -1 },
                    output: {
                        rank: { $rank: {} }
                    }
                }
            },
            { $sort: { rank: 1, ratingAverage: -1 } },
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
                $lookup: {
                    from: "brands",
                    localField: "brandId",
                    foreignField: "_id",
                    as: "brandInfo"
                }
            },
            {
                $unwind: {
                    path: "$brandInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    title: 1,
                    brand: "$brandInfo.name",
                    rating: "$ratingAverage",
                    ratingCount: 1,
                    price: 1,
                    images: 1
                }
            }
        ];

        const products = await productHelper.aggregate(pipeline);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const searchProductsRegex = async (req, res) => {
    try {
        const { regex } = req.query;


        if (!regex) {
            return res.status(400).json({ message: "Regex pattern is required in 'regex' field" });
        }

        const searchableFields = ['title', 'description', 'tags', 'ingredients', 'skinType', 'howToUse'];
        let query = {};
        // const query = {
        //     $or: searchableFields.map(field => ({
        //         [field]: { $regex: regex, $options: 'i' }
        //     }))
        // };

        const search = regex.toLowerCase();


        if (
            search.includes('perfume') ||
            search.includes('fragrance') ||
            search.includes('body mist') ||
            search.includes('body spray') ||
            search.includes('scent')
        ) {
            query.categoryId = '697b3d920e5d33344bace45a';
        }


        const isBrand = await brandHelper.getObjectByQuery({ query: { name: { $regex: regex, $options: 'i' } } });
        if (isBrand) {
            query.brandId = isBrand._id;
        }

        const isCategory = await categoryHelper.getObjectByQuery({ query: { name: { $regex: regex, $options: 'i' } } });
        if (isCategory) {
            query.categoryId = isCategory._id;
        }

        if (!isBrand && !isCategory) {
            query = {
                $or: searchableFields.map(field => ({
                    [field]: { $regex: regex, $options: 'i' }
                }))
            }
        }

        // Populate category and brand (matching existing structure)
        const populatedQuery = [
            { path: "categoryId", select: "name" },
            { path: "brandId", select: "name" },
            { path: "sellerId", select: "storeName address" }
        ];


        const products = await productHelper.getAllObjects({
            query,
            populatedQuery,
            sortBy: { createdAt: -1 }
        });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
