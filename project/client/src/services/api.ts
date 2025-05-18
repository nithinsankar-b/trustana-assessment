// client/src/services/api.ts
import axios from 'axios';

// Types
import type { Product } from '../types/product';
import type { Attribute } from '../types/attribute';
import type { EnrichmentJob } from '../types/enrichment';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Product endpoints
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products');
  return response.data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const response = await api.post('/products', product);
  return response.data;
};

export const updateProduct = async (id: number, product: Partial<Product>): Promise<Product> => {
  const response = await api.put(`/products/${id}`, product);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};

// Attribute endpoints
export const getAttributes = async (): Promise<Attribute[]> => {
  const response = await api.get('/attributes');
  return response.data;
};

export const getAttribute = async (id: number): Promise<Attribute> => {
  const response = await api.get(`/attributes/${id}`);
  return response.data;
};

export const createAttribute = async (attribute: Omit<Attribute, 'id' | 'createdAt' | 'updatedAt'>): Promise<Attribute> => {
  const response = await api.post('/attributes', attribute);
  return response.data;
};

export const updateAttribute = async (id: number, attribute: Partial<Attribute>): Promise<Attribute> => {
  const response = await api.put(`/attributes/${id}`, attribute);
  return response.data;
};

export const deleteAttribute = async (id: number): Promise<void> => {
  await api.delete(`/attributes/${id}`);
};

// Enrichment endpoints
export const enrichProducts = async (productIds: number[]): Promise<{ jobId: number; message: string }> => {
  const response = await api.post('/enrichment/products', { productIds });
  return response.data;
};

export const getEnrichmentJobStatus = async (jobId: number): Promise<EnrichmentJob> => {
  const response = await api.get(`/enrichment/status/${jobId}`);
  return response.data;
};

export default api;