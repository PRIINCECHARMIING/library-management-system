import { z } from 'zod';

const isValidISBN = (val) => {
  if (!val || typeof val !== 'string') return false;
  const clean = val.replace(/[-\s]/g, '');
  return /^([0-9]{9}[0-9X]|[0-9]{13})$/i.test(clean);
};

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Book title is required').max(255),
  author: z.string().trim().min(1, 'Author is required').max(255),
  isbn: z.string().trim().refine(isValidISBN, { message: 'Invalid ISBN-10 or ISBN-13 format' }),
  categoryId: z.string().trim().min(1, 'Category ID is required'),
  publishedYear: z
    .number({ invalid_type_error: 'Published year must be a number' })
    .int()
    .min(1000, 'Published year must be >= 1000')
    .max(new Date().getFullYear() + 1, 'Published year cannot be in the far future'),
  totalCopies: z
    .number({ invalid_type_error: 'Total copies must be a number' })
    .int()
    .min(1, 'Total copies must be at least 1'),
  location: z.string().trim().optional().default('General Shelf'),
  description: z.string().trim().optional().default('')
});

export const updateBookSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  author: z.string().trim().min(1).max(255).optional(),
  isbn: z.string().trim().refine(isValidISBN, { message: 'Invalid ISBN format' }).optional(),
  categoryId: z.string().trim().min(1).optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear() + 1).optional(),
  totalCopies: z.number().int().min(1).optional(),
  location: z.string().trim().optional(),
  description: z.string().trim().optional()
});

export const bookQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  author: z.string().trim().optional(),
  availableOnly: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  page: z
    .string()
    .optional()
    .transform(val => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10))
});
