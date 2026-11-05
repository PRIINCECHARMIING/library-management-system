import { z } from 'zod';

export const borrowBookSchema = z.object({
  bookId: z.string().trim().min(1, 'Book ID is required'),
  memberId: z.string().trim().optional(), // Allowed for Librarian/Admin issuing on behalf of a member
  days: z
    .number()
    .int()
    .min(1, 'Loan duration must be at least 1 day')
    .max(60, 'Loan duration cannot exceed 60 days')
    .optional()
    .default(14)
});

export const returnBookSchema = z.object({
  borrowingId: z.string().trim().min(1, 'Borrowing ID is required')
});
