import { ApiClient } from '@smartbudget/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smartbudget-api.vercel.app/api';

export const api = new ApiClient({ baseUrl: API_URL });
