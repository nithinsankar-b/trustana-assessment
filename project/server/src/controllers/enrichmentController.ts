// src/controllers/enrichmentController.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { enrichProductWithAI } from '../services/aiEnrichmentService';

const prisma = new PrismaClient();

export const enrichProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new ApiError(400, 'Product IDs are required');
    }
    
    // Create an enrichment job to track progress
    const enrichmentJob = await prisma.enrichmentJob.create({
      data: {
        productIds,
        status: 'PENDING',
        progress: 0
      }
    });
    
    // Start the enrichment process asynchronously
    process.nextTick(async () => {
      try {
        await processEnrichmentJob(enrichmentJob.id);
      } catch (error) {
        console.error('Error in enrichment job:', error);
        
        // Update job status to failed
        await prisma.enrichmentJob.update({
          where: { id: enrichmentJob.id },
          data: {
            status: 'FAILED',
            result: { error: (error as Error).message } as Prisma.InputJsonValue
          }
        });
      }
    });
    
    // Return the job ID so the client can poll for updates
    res.status(202).json({
      jobId: enrichmentJob.id,
      message: 'Enrichment job started'
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrichmentJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid job ID');
    }
    
    const job = await prisma.enrichmentJob.findUnique({
      where: { id }
    });
    
    if (!job) {
      throw new ApiError(404, 'Enrichment job not found');
    }
    
    res.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to process the enrichment job
async function processEnrichmentJob(jobId: number) {
  // Retrieve the job
  const job = await prisma.enrichmentJob.findUnique({
    where: { id: jobId }
  });
  
  if (!job) {
    throw new Error('Enrichment job not found');
  }
  
  // Update job status to processing
  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: {
      status: 'PROCESSING',
      progress: 5
    }
  });
  
  // Get all products to be enriched
  const products = await prisma.product.findMany({
    where: {
      id: { in: job.productIds }
    }
  });
  
  // Get all attribute definitions
  const attributes = await prisma.attribute.findMany();
  
  // Process each product
  const enrichedProducts: typeof products = [];
  const totalProducts = products.length;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      // Update progress
      await prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          progress: 5 + ((i / totalProducts) * 90)
        }
      });
      
      // Enrich the product using AI
      const enrichedAttributes = await enrichProductWithAI(product, attributes);
      
      // Update the product with enriched attributes
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          attributes: enrichedAttributes as Prisma.InputJsonValue,
          ai_enriched: true
        }
      });
      
      enrichedProducts.push(updatedProduct);
    } catch (error) {
      console.error(`Error enriching product ${product.id}:`, error);
      // Continue with the next product even if one fails
    }
  }
  
  // Mark job as completed
  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      result: {
        enrichedCount: enrichedProducts.length,
        failedCount: totalProducts - enrichedProducts.length
      } as Prisma.InputJsonValue
    }
  });
  
  return enrichedProducts;
}