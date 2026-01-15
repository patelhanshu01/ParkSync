import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material';

type HeapMetrics = {
  used?: number;
  total?: number;
  limit?: number;
};

type CacheMetrics = {
  caches: Array<{
    name: string;
    entries: number;
    sizeBytes: number | null;
    unknownSizeEntries: number;
  }>;
};

type StorageMetrics = {
  usage?: number;
  quota?: number;
  details?: Record<string, number>;
  localStorageBytes: number;
  sessionStorageBytes: number;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return 'n/a';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(2)} ${units[idx]}`;
};

const estimateStorageBytes = (storage: Storage) => {
  let total = 0;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;
    const value = storage.getItem(key) || '';
    total += (key.length + value.length) * 2;
  }
  return total;
};

const MemoryUsage: React.FC = () => {
  const [heap, setHeap] = useState<HeapMetrics>({});
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics>({ caches: [] });
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics>({
    localStorageBytes: 0,
    sessionStorageBytes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detailEntries = useMemo(
    () => Object.entries(storageMetrics.details || {}),
    [storageMetrics.details]
  );

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const perf: any = performance;
      const memory = perf?.memory;
      setHeap({
        used: memory?.usedJSHeapSize,
        total: memory?.totalJSHeapSize,
        limit: memory?.jsHeapSizeLimit
      });

      const storageEstimate = await navigator.storage?.estimate?.();
      const details = (storageEstimate as any)?.usageDetails || {};
      setStorageMetrics({
        usage: storageEstimate?.usage,
        quota: storageEstimate?.quota,
        details,
        localStorageBytes: estimateStorageBytes(localStorage),
        sessionStorageBytes: estimateStorageBytes(sessionStorage)
      });

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const cacheStats = await Promise.all(
          cacheNames.map(async (name) => {
            const cache = await caches.open(name);
            const requests = await cache.keys();
            const responses = await Promise.all(
              requests.map((request) => cache.match(request))
            );
            let sizeBytes = 0;
            let unknown = 0;
            for (let i = 0; i < responses.length; i++) {
              const response = responses[i];
              if (!response) continue;
              const contentLength = response.headers.get('content-length');
              if (contentLength) {
                sizeBytes += Number(contentLength);
              } else {
                unknown += 1;
              }
            }
            return {
              name,
              entries: requests.length,
              sizeBytes: sizeBytes || null,
              unknownSizeEntries: unknown
            };
          })
        );
        setCacheMetrics({ caches: cacheStats });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to read memory usage.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Memory Usage</Typography>
        <Button variant="outlined" onClick={loadMetrics} disabled={loading}>Refresh</Button>
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Heap (Browser JS)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          `performance.memory` is only available in Chromium-based browsers.
        </Typography>
        <Stack spacing={1}>
          <Typography>Used: {formatBytes(heap.used)}</Typography>
          <Typography>Total: {formatBytes(heap.total)}</Typography>
          <Typography>Limit: {formatBytes(heap.limit)}</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Storage (Cache + Persistent)</Typography>
        <Stack spacing={1}>
          <Typography>Usage: {formatBytes(storageMetrics.usage)}</Typography>
          <Typography>Quota: {formatBytes(storageMetrics.quota)}</Typography>
          <Typography>LocalStorage: {formatBytes(storageMetrics.localStorageBytes)}</Typography>
          <Typography>SessionStorage: {formatBytes(storageMetrics.sessionStorageBytes)}</Typography>
        </Stack>
        {detailEntries.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Usage Details</Typography>
            <Stack spacing={0.5}>
              {detailEntries.map(([key, value]) => (
                <Typography key={key}>{key}: {formatBytes(value)}</Typography>
              ))}
            </Stack>
          </>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Cache Storage</Typography>
        {cacheMetrics.caches.length === 0 ? (
          <Typography color="text.secondary">No Cache Storage entries found.</Typography>
        ) : (
          <Stack spacing={2}>
            {cacheMetrics.caches.map((cache) => (
              <Box key={cache.name} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography fontWeight={600}>{cache.name}</Typography>
                <Typography>Entries: {cache.entries}</Typography>
                <Typography>Known Size: {formatBytes(cache.sizeBytes)}</Typography>
                {cache.unknownSizeEntries > 0 && (
                  <Typography color="text.secondary">Unknown sizes: {cache.unknownSizeEntries}</Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
};

export default MemoryUsage;
