import { SetMetadata } from '@nestjs/common';

export const REQUIRES_CSRF = 'requiresCsrf';
export const RequireCsrf = () => SetMetadata(REQUIRES_CSRF, true);
