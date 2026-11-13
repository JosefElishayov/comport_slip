import { publicJson, serverCard } from '@/lib/agent-discovery';
export function GET() { return publicJson(serverCard); }
