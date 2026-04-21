/**
 * Minimal router for Cloudflare Workers.
 * Supports :param (single segment) and *param (greedy — rest of path).
 */

type Handler = (req: Request, env: any, params: Record<string, string>) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  private add(method: string, path: string, handler: Handler) {
    const paramNames: string[] = [];

    // Build regex by walking segments, preserving left-to-right param order
    const segments = path.split('/').filter(Boolean);
    const regexParts: string[] = [];

    for (const seg of segments) {
      if (seg.startsWith('*')) {
        // Greedy wildcard — captures rest of path including slashes
        paramNames.push(seg.slice(1));
        regexParts.push('(.+)');
      } else if (seg.startsWith(':')) {
        // Single segment param
        paramNames.push(seg.slice(1));
        regexParts.push('([^/]+)');
      } else {
        // Literal segment
        regexParts.push(seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }
    }

    const pattern = new RegExp(`^/${regexParts.join('/')}$`);

    this.routes.push({ method, pattern, paramNames, handler });
  }

  get(path: string, handler: Handler) { this.add('GET', path, handler); }
  post(path: string, handler: Handler) { this.add('POST', path, handler); }
  put(path: string, handler: Handler) { this.add('PUT', path, handler); }
  delete(path: string, handler: Handler) { this.add('DELETE', path, handler); }

  async handle(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = url.pathname.match(route.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      return route.handler(req, env, params);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
}
