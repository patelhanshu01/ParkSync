const { createClient } = require('redis');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return 'n/a';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(2)} ${units[idx]}`;
};

const parseRedisInfo = (info) => {
  const lines = info.split('\n');
  const stats = {};
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [key, value] = line.trim().split(':');
    if (!key || value === undefined) continue;
    stats[key] = value;
  }
  return stats;
};

const buildRedisClient = () => {
  if (process.env.REDIS_URL) {
    return createClient({ url: process.env.REDIS_URL });
  }
  if (process.env.REDIS_HOST) {
    return createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379)
      },
      password: process.env.REDIS_PASSWORD || undefined
    });
  }
  return null;
};

const printHeapUsage = () => {
  const mem = process.memoryUsage();
  console.log('Heap/Process Memory');
  console.log(`- rss: ${formatBytes(mem.rss)}`);
  console.log(`- heapTotal: ${formatBytes(mem.heapTotal)}`);
  console.log(`- heapUsed: ${formatBytes(mem.heapUsed)}`);
  console.log(`- external: ${formatBytes(mem.external)}`);
  console.log(`- arrayBuffers: ${formatBytes(mem.arrayBuffers)}`);
};

const printRedisUsage = async () => {
  const client = buildRedisClient();
  if (!client) {
    console.log('Cache Memory');
    console.log('- Redis not configured (set REDIS_URL or REDIS_HOST).');
    return;
  }

  try {
    client.on('error', (err) => {
      console.warn('Redis error:', err.message || err);
    });
    await client.connect();
    const info = await client.info('memory');
    const stats = parseRedisInfo(info);
    const usedBytes = Number(stats.used_memory || 0);
    const peakBytes = Number(stats.used_memory_peak || 0);
    console.log('Cache Memory (Redis)');
    console.log(`- used_memory: ${stats.used_memory_human || formatBytes(usedBytes)}`);
    console.log(`- peak_memory: ${stats.used_memory_peak_human || formatBytes(peakBytes)}`);
    if (stats.mem_fragmentation_ratio) {
      console.log(`- fragmentation_ratio: ${stats.mem_fragmentation_ratio}`);
    }
  } catch (err) {
    console.log('Cache Memory');
    console.log(`- Redis unavailable: ${err.message || err}`);
  } finally {
    if (client.isOpen) {
      await client.disconnect();
    }
  }
};

const run = async () => {
  printHeapUsage();
  console.log('');
  await printRedisUsage();
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
