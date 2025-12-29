import React from 'react';
import '@google/model-viewer';
import { Box, Typography, Stack, Chip } from '@mui/material';

const ParkingAR: React.FC<{ glbPath?: string; usdzPath?: string; glbUrl?: string }> = ({ glbPath = '/models/parking.glb', usdzPath = '/models/parking.usdz', glbUrl }) => {
  const src = glbUrl || glbPath;
  const hasExportedModel = Boolean(glbUrl);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(11,17,27,0.7)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ color: '#e2e8f0' }}>AR Portal</Typography>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label="WebXR" color="primary" />
          <Chip size="small" label="Quick Look" variant="outlined" sx={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.6)' }} />
        </Stack>
      </Box>

      <Box sx={{ height: 420 }}>
        <model-viewer
          src={src}
          ios-src={usdzPath}
          alt="Parking layout"
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          style={{ width: '100%', height: '100%', background: '#02050b' }}
        />
      </Box>

      <Box sx={{ p: 2, display: 'grid', gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
          {hasExportedModel ? 'Your exported layout is ready. Tap the AR button on mobile to place it in your space.' : 'Export the live 3D scene first to preview it here in AR.'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Tip: iOS Quick Look prefers a .usdz asset. The GLB export works for WebXR/Android Scene Viewer out of the box.
        </Typography>
      </Box>
    </Box>
  );
};

export default ParkingAR;
