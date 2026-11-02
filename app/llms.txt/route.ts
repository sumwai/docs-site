import { llmsIndex } from '@/lib/llms';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(await llmsIndex(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
