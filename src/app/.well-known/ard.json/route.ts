import { agentCatalog, publicJson } from '@/lib/agent-discovery';
export function GET() { return publicJson(agentCatalog()); }
