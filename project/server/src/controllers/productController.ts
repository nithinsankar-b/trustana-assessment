import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid product ID');
    }
    
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, brand, barcode, images, attributes } = req.body;
    
    if (!name || !brand) {
      throw new ApiError(400, 'Name and brand are required');
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        brand,
        barcode,
        images: images || [],
        attributes: attributes || {}
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid product ID');
    }
    
    const { name, brand, barcode, images, attributes } = req.body;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      throw new ApiError(404, 'Product not found');
    }
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        brand: brand !== undefined ? brand : undefined,
        barcode: barcode !== undefined ? barcode : undefined,
        images: images !== undefined ? images : undefined,
        attributes: attributes !== undefined ? attributes : undefined
      }
    });
    
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid product ID');
    }
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      throw new ApiError(404, 'Product not found');
    }
    
    // Delete product
    await prisma.product.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};