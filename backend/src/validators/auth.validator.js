import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    username: z.string().trim().toLowerCase().min(1, 'Username is required').max(50),
    password: z.string().min(1, 'Password is required').max(200),
  }),
};
