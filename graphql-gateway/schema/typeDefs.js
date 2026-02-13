const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type User {
    _id: ID!
    name: String!
    email: String!
    role: String
    isEmailVerified: Boolean
    addresses: [Address]
  }



  type Product {
  _id: ID!
  title: String!
  description: String
  brandId: Brand
  categoryId: Category
  sellerId: ID
  images: [String]
  tags: [String]
  ingredients: [String]
  skinType: [String]
  howToUse: String
  price: Float
  discountPrice: Float
  ratingAverage: Float
  ratingCount: Int
  isActive: Boolean
  createdAt: String
  updatedAt: String
  seller: Seller
  inventory: Inventory
}
type Brand {
  _id: ID!
  name: String!
  logo: String
  description: String
  isActive: Boolean
  slug: String
  metaTitle: String
  metaDescription: String
  metaKeywords: [String]
  createdAt: String
  updatedAt: String
}
type Category {
  _id: ID!
  name: String!
  image: String
  description: String
}

type Address {
  _id: ID
  userId: ID
  fullName: String
  phone: String
  addressLine1: String
  addressLine2: String
  city: String
  state: String
  country: String
  pincode: String
  type: String
  createdAt: String
  updatedAt: String
}


  type Dimensions {
    length: Float
    width: Float
    height: Float
  }

  type Inventory {
    _id: ID
    productId: ID
    sellerId: ID
    currentStock: Int
    reservedStock: Int
    warehouseLocation: String
    product: Product
    seller: Seller
  }

  type Seller {
    _id: ID
    storeName: String
    ownerName: String
    email: String
    address: Address
    products: [Product]
  }

  type OrderItem {
    _id: ID
    productId: ID
    parentOrderId: ID
    parentOrder:Order
    titleSnapshot: String
    price: Float
    quantity: Int
    status:String
    product: Product
    shipmentId: ID
    shipment: Shipment
    statusHistory: [StatusHistory]
    sellerOrderId: ID
    imageSnapshot: String
    itemTotal: Float
    refundAmount: Float
    createdAt: Date
    updatedAt: Date
  }

  type StatusHistory {
    status: String
    date: Date
  }

  type Order {
    _id: ID!
    userId: ID
    user: User
    orderItems: [OrderItem]
    totalAmount: Float
    status: String
    paymentStatus: String
    shippingAddress: Address
    createdAt: Date
    payment: Payment
    shipment: Shipment
  }

  type SellerOrderItem {
    productId: ID
    product: Product
    titleSnapshot: String
    priceSnapshot: Float
    quantity: Int
    variantId: ID
  }

  type SellerOrder {
    _id: ID!
    parentOrderId: ID!
    parentOrder: Order
    sellerId: ID
    userId: ID
    user: User
    items: [SellerOrderItem]
    status: String
    statusHistory: [StatusHistory]
    createdAt: Date
    updatedAt: Date
  }

  type SellerOrderResponse {
    status: String
    results: Int
    total: Int
    PageNum: Int
    pageSize: Int
    data: [SellerOrder]
  }

  type CartItem {
    productId: ID!
    product: Product
    quantity: Int!
    price: Float
  }

  type Cart {
    _id: ID
    userId: ID
    items: [CartItem]
    totalPrice: Float
  }

  type Payment {
    _id: ID!
    orderId: ID!
    amount: Float
    currency: String
    status: String
    gateway: String
    transactionId: String
    createdAt: Date
  }

  type Shipment {
    _id: ID!
    sellerOrderId: ID
    parentOrderId: ID
    sellerId: ID
    shipmentStatus: String
    courierName: String
    trackingNumber: String
    trackingHistory: [ShipmentHistory]
    createdAt: Date
    updatedAt: Date
  }

  type ShipmentHistory {
    _id: ID
    status: String
    slug: String
    remark: String
    timestamp: Date
    location: String
  }

  type Notification {
    _id: ID!
    userId: ID
    eventKey: String
    category: String
    title: String
    body: String
    imageUrl: String
    action: NotificationAction
    entity: NotificationEntity
    metadata: NotificationMetadata
    status: String
    createdAt: Date
    updatedAt: Date
  }

  type NotificationAction {
    type: String
    value: String
  }

  type NotificationEntity {
    entityType: String
    entityId: ID
  }

  type NotificationMetadata {
    orderId: ID
    userId: ID
  }

  type NotificationPagination {
    page: Int
    limit: Int
    total: Int
    pages: Int
  }

  type NotificationData {
    notifications: [Notification]
    pagination: NotificationPagination
    unreadCount: Int
  }

  type NotificationResponse {
    status: String
    data: NotificationData
  }

  type Ticket {
    _id: ID!
    userId: ID
    subject: String
    message: String
    status: String
    priority: String
    category: String
    responses: [TicketResponse]
    createdAt: Date
  }

  type TicketResponse {
    responderId: ID
    message: String
    createdAt: Date
  }

  type ProductSummary {
    _id: ID
    title: String
    brand: String
    rating: Float
    ratingCount: Int
    price: Float
    images: [String]
  }

  type RecommendedProductSection {
    category: String
    product: ProductSummary
  }

  type Query {
    # User
    me: User
    users: [User]
    user(id: ID!): User
    myAddresses: [Address]
    
    # Product
    products(page: Int, limit: Int, category: String, search: String): [Product]
    product(id: ID!): Product
    popularProducts(page: Int, limit: Int): [ProductSummary]
    recommendedProducts: [RecommendedProductSection]
    categories: [Category]
    brands: [Brand]
    
    # Seller
    seller(id: ID!): Seller
    allSellerOrders(status: String, pageSize: Int, PageNum: Int): SellerOrderResponse

    # Order
    order(id: ID!): Order
    orderItem(id: ID!, parentOrderId: ID!): OrderItem

    myOrders: [Order]
    ordersByUser: [Order]
    allOrders(status: String): [Order]

    # Cart
    myCart: Cart

    # Payment
    payment(id: ID!): Payment
    paymentByOrder(orderId: ID!): Payment

    # Fulfillment
    shipment(id: ID!): Shipment
    shipmentByOrder(orderId: ID!): Shipment
    shipmentTracking(orderId: ID!, orderItemId: ID!): ShipmentTrackingDetails

    # Notification
    myNotifications: NotificationResponse

    # Support
    myTickets: [Ticket]
    ticket(id: ID!): Ticket
    
    # Inventory
    allInventory: [Inventory]
  }

  type ShipmentTrackingDetails {
    orderId: ID
    orderItemId: ID
    status: String
    trackingNumber: String
    courierName: String
    shippingAddress: Address
    orderTimeline: [OrderTimelineEvent]
    shipmentHistory: [ShipmentHistory]
    estimatedDelivery: Date
  }

  type OrderTimelineEvent {
    status: String
    timestamp: Date
    remark: String
  }

  type Mutation {
    # Cart
    addToCart(productId: ID!, quantity: Int!): Cart
    removeFromCart(productId: ID!): Cart
    
    # Notification
    markNotificationRead(id: ID!): Notification
    
    # Support
    createTicket(subject: String!, message: String!): Ticket
    
    # We can add more mutations here as needed, but standard logic often relies on 
    # specific services handling complex flows via their own APIs or orchestrators.
    # For now, these are the requested integrations.
  }
`;

module.exports = typeDefs;
