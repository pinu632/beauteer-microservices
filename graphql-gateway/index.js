const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const dotenv = require('dotenv');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');

dotenv.config();

const app = express();
app.use(cors());

async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            // Pass headers or auth context if needed
            return { token: req.headers.authorization };
        },
        formatError: (err) => {
            console.error(err);
            return err;
        }
    });

    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Gateway ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer().catch(err => {
    console.error("Failed to start gateway", err);
});
