const userService = require('../services/userService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const sellerService = require('../services/sellerService');
const inventoryService = require('../services/inventoryService');
const cartService = require('../services/cartService');
const paymentService = require('../services/paymentService');
const fulfillmentService = require('../services/fulfillmentService');
const notificationService = require('../services/notificationService');
const supportService = require('../services/supportService');
const marketingService = require('../services/marketingService');

const resolvers = {
    Query: {
        // User
        users: async (_, __, context) => {
            return await userService.getAllUsers(context.token);
        },
        user: async (_, { id }, context) => {
            return await userService.getUserById(id, context.token);
        },
        me: async (_, __, context) => {
            // Assuming we have a /me endpoint or similar in userService, 
            // or we decode token and fetch user. 
            // For now, let's reuse getUserById if we can parse the token ID, 
            // but cleaner is to have a dedicated profile method or just not implement if not strictly required yet.
            // We'll skip specific implementation details of token parsing here for brevity 
            // and assume the user service handles /me or we rely on ID.
            // Let's return null for now if not implemented in service wrapper.
            return null;
        },
        myAddresses: async (_, __, context) => {
            return await userService.getMyAddresses(context.token);
        },

        // Product
        products: async (_, { page, limit, category, search }) => {
            // Updated productService might support category/search, passing params
            return await productService.getAllProducts({ page, limit, category, search });
        },
        product: async (_, { id }) => {
            return await productService.getProductById(id);
        },
        popularProducts: async (_, { page, limit }) => {
            return await productService.getPopularProducts({ page, limit });
        },
        recommendedProducts: async () => {
            return await productService.getRecommendedProducts();
        },
        categories: async () => {
            return await productService.getAllCategories();
        },
        brands: async () => {
            return await productService.getAllBrands();
        },

        // Order
        order: async (_, { id }, context) => {
            return await orderService.getOrderById(id, context.token);
        },
        orderItem: async (_, { id, parentOrderId }, context) => {
            return await orderService.getOrderItemDetails(id, parentOrderId, context.token);
        },
        myOrders: async (_, __, context) => {
            // Extract user ID from token or trust gateway context if enhanced
            // Simple approach: relying on token being passed to service and service uses it.
            return await orderService.getMyOrders(context.token);
        },
        ordersByUser: async (_, __, context) => {
            return await orderService.getOrdersByUser(context.token);
        },
        allOrders: async (_, { status }, context) => {
            return await orderService.getAllOrders(context.token, status);
        },

        // Seller
        seller: async (_, { id }, context) => {
            return await sellerService.getSellerById(id, context.token);
        },
        allSellerOrders: async (_, args, context) => {
            return await sellerService.getAllSellerOrders(context.token, args);
        },

        // Cart
        myCart: async (_, __, context) => {
            return await cartService.getCart(context.token);
        },

        // Payment
        payment: async (_, { id }, context) => {
            return await paymentService.getPaymentById(id, context.token);
        },
        paymentByOrder: async (_, { orderId }, context) => {
            return await paymentService.getPaymentByOrderId(orderId, context.token);
        },
        allPaymentLogs: async (_, args, context) => {
            return await paymentService.getAllPaymentLogs(context.token, args);
        },

        // Fulfillment
        shipment: async (_, { id }, context) => {
            return await fulfillmentService.trackShipment(id, context.token);
        },
        shipmentByOrder: async (_, { orderId }, context) => {
            return await fulfillmentService.getShipmentByOrderId(orderId, context.token);
        },
        shipmentTracking: async (_, { orderId, orderItemId }, context) => {
            return await fulfillmentService.getShipmentTrackingDetails(orderId, orderItemId, context.token);
        },
        returns: async (_, __, context) => {
            return await fulfillmentService.getAllReturns(context.token);
        },

        // Notification
        myNotifications: async (_, __, context) => {
            return await notificationService.getNotifications(context.token);
        },

        // Support
        myTickets: async (_, __, context) => {
            return await supportService.getTickets(context.token);
        },
        allTickets: async (_, args, context) => {
            return await supportService.getAllTickets(context.token, args);
        },
        ticket: async (_, { id }, context) => {
            return await supportService.getTicketById(id, context.token);
        },
        ticketMessages: async (_, { ticketId }, context) => {
            return await supportService.getTicketMessages(ticketId, context.token);
        },

        // Inventory
        allInventory: async (_, __, context) => {
            return await inventoryService.getAllInventory();
        },

        // Marketing
        allCampaigns: async (_, args, context) => {
            return await marketingService.getAllCampaigns(context.token, args);
        },
        campaign: async (_, { id }, context) => {
            return await marketingService.getCampaignById(id, context.token);
        },
        allBanners: async (_, args, context) => {
            return await marketingService.getAllBanners(context.token, args);
        },
        banner: async (_, { id }, context) => {
            return await marketingService.getBannerById(id, context.token);
        }
    },

    Mutation: {
        // Cart
        addToCart: async (_, { productId, quantity }, context) => {
            return await cartService.addToCart(productId, quantity, context.token);
        },
        removeFromCart: async (_, { productId }, context) => {
            return await cartService.removeFromCart(productId, context.token);
        },

        // Notification
        markNotificationRead: async (_, { id }, context) => {
            return await notificationService.markRead(id, context.token);
        },

        // Support
        createTicket: async (_, { subject, message }, context) => {
            return await supportService.createTicket(subject, message, context.token);
        },

        // Marketing
        createCampaign: async (_, args, context) => {
            return await marketingService.createCampaign(args, context.token);
        },
        updateCampaign: async (_, args, context) => {
            const { id, ...data } = args;
            return await marketingService.updateCampaign(id, data, context.token);
        },
        deleteCampaign: async (_, { id }, context) => {
            return await marketingService.deleteCampaign(id, context.token);
        },
        createBanner: async (_, args, context) => {
            return await marketingService.createBanner(args, context.token);
        },
        updateBanner: async (_, args, context) => {
            const { id, ...data } = args;
            return await marketingService.updateBanner(id, data, context.token);
        },
        deleteBanner: async (_, { id }, context) => {
            return await marketingService.deleteBanner(id, context.token);
        }
    },

    // Field Resolvers
    Product: {
        inventory: async (parent) => {
            return await inventoryService.getInventoryByProductId(parent._id);
        },
        seller: async (parent, _, context) => {
            // Assumes product has sellerId
            if (parent.sellerId) {
                return await sellerService.getSellerById(parent.sellerId, context.token);
            }
            return null;
        }
    },
    Order: {
        user: async (parent, _, context) => {
            if (parent.userId) {
                return await userService.getUserById(parent.userId, context.token);
            }
            return null;
        },
        orderItems: async (parent) => {
            // If items are already populated, return them. 
            // If they are just IDs, we might need to fetch products.
            // For now, assume order service returns full objects or we map them.
            // The schema expects orderItems, and the parent object likely has it as propery (or previously items)
            // We'll return parent.orderItems or parent.items as fallback
            return parent.orderItems || parent.items;
        },
        payment: async (parent, _, context) => {
            return await paymentService.getPaymentByOrderId(parent._id, context.token);
        },
        shipment: async (parent, _, context) => {
            return await fulfillmentService.getShipmentByOrderId(parent._id, context.token);
        },
        shippingAddress: async (parent, _, context) => {

            if (parent.shippingAddress) {
                return await userService.getAddressById(parent.shippingAddress, context.token);
            }
            return null;
        }
    },
    OrderItem: {
        product: async (parent) => {
            if (parent.productId) {
                return await productService.getProductById(parent.productId);
            }
            return null;
        },
        shipment: async (parent, _, context) => {
            if (parent.shipmentId) {
                return await fulfillmentService.trackShipment(parent.shipmentId, context.token);
            }
            return null;
        },
        parentOrder: async (parent, _, context) => {
            return await orderService.getOrderById(parent.parentOrderId, context.token);
        }
    },
    CartItem: {
        product: async (parent) => {
            if (parent.productId) {
                return await productService.getProductById(parent.productId);
            }
            return null;
        }
    },
    SellerOrder: {
        user: async (parent, _, context) => {
            if (parent.userId) {
                return await userService.getUserById(parent.userId, context.token);
            }
            return null;
        },
        parentOrder: async (parent, _, context) => {
            return await orderService.getOrderById(parent.parentOrderId, context.token);
        }

    },
    SellerOrderItem: {
        product: async (parent) => {
            if (parent.productId) {
                return await productService.getProductById(parent.productId);
            }
            return null;
        }

    },
    Seller: {
        products: async (parent) => {
            // Need a way to fetch products by seller ID
            // Assuming productService has getProductsBySellerId
            return []; // Placeholder until supported
        }
    },

    Inventory: {
        product: async (parent) => {
            console.log(parent, "parent")
            if (parent.productId) {
                // If productId is populated, it might be an object, check constraints
                // Inventory service `getInventory` populates `productId`.
                // If populated, parent.productId is object. If not, it is ID.
                // Let's handle both or assume standard ID if not populated.
                // The existing controller `getInventory` populates `productId`.
                // So parent.productId acts as the Product object.
                // But wait, the schema expects type Product.
                // If it is already an object, we can return it directly? 
                // Or does it need to be resolved? 
                // If the object structure matches Product type, it's fine.
                // However, `productId` field in Inventory model is ref to Product.
                // If `populate('productId')` is used, `parent.productId` holds the product data.
                // We should alias it or return it.
                // BUT, if we want to resolve fields within Product that need resolving (like Brand), 
                // we might need to let the Product resolver handle it? 
                // Or just return the object and let standard execution flow?
                // Mongoose populated object usually has _id, title etc.
                if (typeof parent.productId === 'object' && parent.productId !== null) {
                    return parent.productId;
                }
                console.log(parent.productId, "parent.productId")
                return await productService.getProductById(parent.productId);
            }
            return null;
        },
        seller: async (parent, _, context) => {
            if (parent.sellerId) {
                return await sellerService.getSellerById(parent.sellerId, context.token);
            }
            return null;
        }
    },
    ReturnRequest: {
        user: async (parent, _, context) => {
            if (parent.userId) {
                return await userService.getUserById(parent.userId, context.token);
            }
            return null;
        },
        shipment: async (parent, _, context) => {
            if (parent.shipmentId) {
                return await fulfillmentService.trackShipment(parent.shipmentId, context.token);
            }
            return null;
        },
        products: async (parent, _, context) => {
            if (!parent.sellerOrderId) return [];

            const sellerOrder = await sellerService.getSellerOrderById(parent.sellerOrderId, context.token);
            if (!sellerOrder || !Array.isArray(sellerOrder.items)) return [];

            const productIds = [
                ...new Set(
                    sellerOrder.items
                        .map(item => item.productId && item.productId.toString())
                        .filter(Boolean)
                )
            ];

            const products = await Promise.all(productIds.map((id) => productService.getProductById(id)));
            return products.filter(Boolean);
        }
    },
    Ticket: {
        user: async (parent, _, context) => {
            if (!parent.userId) return null;
            return await userService.getUserById(parent.userId, context.token);
        },
        orderItem: async (parent, _, context) => {
            if (!parent.orderItemId) return null;
            return await orderService.getOrderItemById(parent.orderItemId, context.token);
        },
        sellerOrder: async (parent, _, context) => {
            if (!parent.sellerOrderId) return null;
            return await sellerService.getSellerOrderById(parent.sellerOrderId, context.token);
        }
    },
    Payment: {
        user: async (parent, _, context) => {
            if (parent.userId) {
                return await userService.getUserById(parent.userId, context.token);
            }
            return null;
        },
        order: async (parent, _, context) => {
            if (parent.orderId) {
                return await orderService.getOrderById(parent.orderId, context.token);
            }
            return null;
        }
    },
    PaymentTransaction: {
        orderItem: async (parent, _, context) => {
            if (parent.orderItemId) {
                return await orderService.getOrderItemDetails(parent.orderItemId, null, context.token);
            }
            return null;
        },
        sellerOrder: async (parent, _, context) => {
            if (parent.sellerOrderId) {
                return await sellerService.getSellerOrderById(parent.sellerOrderId, context.token);
            }
            return null;
        }
    }
};

module.exports = resolvers;
