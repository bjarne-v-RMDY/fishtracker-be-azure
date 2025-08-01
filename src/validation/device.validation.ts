import { z } from 'zod';
import { FormattedError, formatZodError } from '../lib/zodErrorFormatter';

export const deviceRegisterValidation = z.object({
    id: z.string().nonempty("ID is required and must be a string"),
});

export const deviceFindValidation = z.object({
    id: z.string().nonempty("ID is required and must be a string")
})


export const validateDeviceId = (id: string): {id: string | null, success: boolean, error: FormattedError | null} => {
    const zodResult = deviceFindValidation.safeParse({id})
    if (!zodResult.success) {
        const formattedError = formatZodError(zodResult.error);

        return {
            error: formattedError,
            id: null,
            success: false,
        }
    }
    return {
        error: null,
        id: zodResult.data.id,
        success: true
    }
}