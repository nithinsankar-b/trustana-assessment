// src/server.ts - Main entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { productRouter } from './routes/productRoutes';
import { attributeRouter } from './routes/attributeRoutes';
import { enrichmentRouter } from './routes/enrichmentRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON payload size limit (change to 50MB)
app.use(express.json({ limit: '50mb' }));
// Also increase URL-encoded payload size limit if you're using this middleware
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/products', productRouter);
app.use('/api/attributes', attributeRouter);
app.use('/api/enrichment', enrichmentRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
