import React from 'react';
import { Card, CardContent, Box, Stack, Skeleton, Divider } from '@mui/material';

export const ParkingLotSkeleton: React.FC = () => {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
        <Skeleton variant="rectangular" height={140} animation="wave" />
        <CardContent sx={{ p: 2 }}>
            <Box sx={{ mb: 1.5 }}>
                <Skeleton variant="text" width="60%" height={28} animation="wave" />
                <Skeleton variant="text" width="40%" height={20} animation="wave" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton variant="rounded" width={60} height={24} animation="wave" />
                <Skeleton variant="rounded" width={60} height={24} animation="wave" />
            </Box>
             <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Skeleton variant="text" width={80} height={40} animation="wave" />
                <Skeleton variant="rounded" width={80} height={24} animation="wave" />
             </Stack>
             <Divider sx={{ my: 2 }} />
             <Skeleton variant="text" width="70%" animation="wave" />
        </CardContent>
    </Card>
  );
};

export const ListingSkeleton: React.FC = () => {
    return (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
             <Skeleton variant="rectangular" height={200} animation="wave" />
             <CardContent sx={{ p: 2.5 }}>
                 <Skeleton variant="text" width="70%" height={32} animation="wave" />
                 <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} animation="wave" />
                 <Skeleton variant="text" width="100%" animation="wave" />
                 <Skeleton variant="text" width="100%" sx={{ mb: 2 }} animation="wave" />
                 <Divider sx={{ my: 2 }} />
                 <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton variant="text" width={60} height={40} animation="wave" />
                    <Skeleton variant="rounded" width={100} height={36} animation="wave" />
                 </Box>
             </CardContent>
        </Card>
    );
};
