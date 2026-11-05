import { z } from 'zod';

export const createApiKeySchema = z.object({
  clientName: z.string().trim().min(2, 'Client name must be at least 2 characters').max(100),
  tier: z.enum(['standard', 'premium', 'admin']).optional().default('standard')
});
