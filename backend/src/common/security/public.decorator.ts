import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Excepción explícita a la autenticación obligatoria. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
