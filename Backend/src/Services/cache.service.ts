import { createClient } from 'redis';

type CacheRecord = {
  value: string;
  expiresAt?: number;
};

export class CacheService {
  private static instance: CacheService;
  private client?: ReturnType<typeof createClient>;
  private memory = new Map<string, CacheRecord>();
  private ready = false;
  private connecting = false;

  private constructor() {}

  static getInstance() {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async connectIfNeeded() {
    if (this.ready || this.connecting) return;
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    if (!redisUrl && !redisHost) return;

    this.connecting = true;
    try {
      const client = createClient(
        redisUrl
          ? { url: redisUrl }
          : {
              socket: {
                host: redisHost,
                port: Number(process.env.REDIS_PORT || 6379)
              },
              password: process.env.REDIS_PASSWORD || undefined
            }
      );
      client.on('error', (err) => {
        console.warn('Redis error:', err);
      });
      await client.connect();
      this.client = client;
      this.ready = true;
    } catch (err) {
      console.warn('Redis connection failed, using in-memory cache.', err);
    } finally {
      this.connecting = false;
    }
  }

  private cleanupMemory(key: string, record?: CacheRecord) {
    if (!record) return;
    if (record.expiresAt && Date.now() > record.expiresAt) {
      this.memory.delete(key);
    }
  }

  async get(key: string) {
    await this.connectIfNeeded();
    if (this.client) {
      return this.client.get(key);
    }
    const record = this.memory.get(key);
    this.cleanupMemory(key, record);
    return record?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await this.connectIfNeeded();
    if (this.client) {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, { EX: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
      return;
    }
    const record: CacheRecord = { value };
    if (ttlSeconds && ttlSeconds > 0) {
      record.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    this.memory.set(key, record);
  }

  async del(key: string) {
    await this.connectIfNeeded();
    if (this.client) {
      await this.client.del(key);
      return;
    }
    this.memory.delete(key);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn('Cache JSON parse error:', err);
      await this.del(key);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number) {
    try {
      const serialized = JSON.stringify(value);
      await this.set(key, serialized, ttlSeconds);
    } catch (err) {
      console.warn(`Cache JSON serialize failed for ${key}`, err);
    }
  }
}
