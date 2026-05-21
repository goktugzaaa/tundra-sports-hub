import { logger } from '../../../observability/logger';

/**
 * Low-level Airtable REST client. Single responsibility: HTTP transport
 * + auth + pagination. Knows nothing about domain entities.
 */

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  /**
   * Optional serverless proxy base URL. When set, requests go here and
   * the proxy attaches the Airtable token server-side — the token never
   * ships in the client bundle. Strongly recommended for production.
   */
  proxyUrl?: string;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface ListResponse {
  records: AirtableRecord[];
  offset?: string;
}

export class AirtableClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: AirtableConfig) {
    const usingProxy = Boolean(config.proxyUrl);
    this.baseUrl = usingProxy
      ? config.proxyUrl!.replace(/\/$/, '')
      : `https://api.airtable.com/v0/${config.baseId}`;
    this.headers = usingProxy
      ? { 'Content-Type': 'application/json' }
      : {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        };
  }

  /** Fetch every record in a table, following Airtable's pagination. */
  async list(table: string): Promise<AirtableRecord[]> {
    const out: AirtableRecord[] = [];
    let offset: string | undefined;
    do {
      const url = new URL(`${this.baseUrl}/${encodeURIComponent(table)}`);
      if (offset) url.searchParams.set('offset', offset);
      const json = (await this.request(url.toString(), { method: 'GET' })) as ListResponse;
      out.push(...json.records);
      offset = json.offset;
    } while (offset);
    return out;
  }

  async get(table: string, id: string): Promise<AirtableRecord> {
    return this.request(`${this.baseUrl}/${encodeURIComponent(table)}/${id}`, {
      method: 'GET',
    }) as Promise<AirtableRecord>;
  }

  async create(table: string, fields: Record<string, unknown>): Promise<AirtableRecord> {
    return this.request(`${this.baseUrl}/${encodeURIComponent(table)}`, {
      method: 'POST',
      body: JSON.stringify({ fields, typecast: true }),
    }) as Promise<AirtableRecord>;
  }

  async update(
    table: string,
    id: string,
    fields: Record<string, unknown>,
  ): Promise<AirtableRecord> {
    return this.request(`${this.baseUrl}/${encodeURIComponent(table)}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields, typecast: true }),
    }) as Promise<AirtableRecord>;
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    logger.debug('airtable.request', init.method, url);
    const res = await fetch(url, { ...init, headers: this.headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error('airtable.error', res.status, body);
      throw new Error(`Airtable request failed (${res.status}).`);
    }
    return res.json();
  }
}
