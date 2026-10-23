import { xenditSandboxWebhook } from '@/lib/global-market/financial/services/xendit-sandbox-webhook-http';

export const runtime = 'nodejs';
export const POST = xenditSandboxWebhook('payment');
