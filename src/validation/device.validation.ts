import { z } from 'zod';

export const deviceRegisterValidation = z.object({
    id: z.string().nonempty("ID is required and must be a string"), // Validate that id exists and is a non-empty string
});