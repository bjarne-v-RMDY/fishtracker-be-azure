import { z } from 'zod';

export const deviceRegisterValidation = z.object({
    id: z.string().nonempty("ID is required and must be a string"),
});

export const deviceFindValidation = z.object({
    id: z.string().nonempty("ID is required and must be a string")
})