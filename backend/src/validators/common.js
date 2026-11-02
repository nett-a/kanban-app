import { z } from 'zod';

export const id = z.uuid({ message: 'Invalid id' });

export const title = (max = 200) => z.string().trim().min(1, 'Required').max(max, `Max ${max} characters`);

export const idParam = (...names) => z.object(Object.fromEntries(names.map((n) => [n, id])));

export const index = z.number().int().min(0);
