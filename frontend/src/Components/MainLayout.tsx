import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
    showSidebar?: boolean;
}

const DRAWER_WIDTH = 240;

const MainLayout: React.FC<MainLayoutProps> = ({ children, showSidebar = true }) => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {showSidebar && <Sidebar open={true} />}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: showSidebar ? 0 : 0,
                    width: showSidebar ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout;
