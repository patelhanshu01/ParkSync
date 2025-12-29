import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider,
    Collapse,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ParkingIcon from '@mui/icons-material/LocalParking';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const DRAWER_WIDTH = 240;

interface SidebarProps {
    open: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [openSections, setOpenSections] = React.useState<{ [key: string]: boolean }>({
        adminBoard: true,
        listSpace: false,
    });

    const handleToggle = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        {
            section: 'Admin Portal',
            key: 'adminPortal',
            items: [
                { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
                { text: 'Your Listing', icon: <ParkingIcon />, path: '/admin/listings' },
                { text: 'Create Listing', icon: <AddLocationIcon />, path: '/admin/create' },
            ],
        },
    ];

    return (
        <Drawer
            variant="permanent"
            open={open}
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #00d4aa 0%, #34e5c8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ParkingIcon sx={{ color: '#0a1929', fontSize: 24, fontWeight: 'bold' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Smart Parking
                </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <List sx={{ px: 2 }}>
                {menuItems.map((section) => (
                    <Box key={section.key}>
                        <ListItemButton
                            onClick={() => handleToggle(section.key)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 212, 170, 0.08)',
                                },
                            }}
                        >
                            <ListItemText
                                primary={section.section}
                                primaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            />
                            {openSections[section.key] ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={openSections[section.key]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {section.items.map((item) => (
                                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemButton
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                borderRadius: 2,
                                                pl: 4,
                                                backgroundColor: isActive(item.path) ? 'rgba(0, 212, 170, 0.15)' : 'transparent',
                                                borderLeft: isActive(item.path) ? '3px solid #00d4aa' : '3px solid transparent',
                                                '&:hover': {
                                                    backgroundColor: isActive(item.path)
                                                        ? 'rgba(0, 212, 170, 0.2)'
                                                        : 'rgba(0, 212, 170, 0.08)',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.text}
                                                primaryTypographyProps={{
                                                    fontWeight: isActive(item.path) ? 600 : 400,
                                                    color: isActive(item.path) ? 'primary.main' : 'text.primary',
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </Box>
                ))}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Divider sx={{ my: 1 }} />
            <List sx={{ px: 2, pb: 2 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={handleLogout}
                        sx={{
                            borderRadius: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 68, 68, 0.08)',
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: '#ff4444' }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Logout"
                            primaryTypographyProps={{
                                fontWeight: 600,
                                color: '#ff4444'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    );
};

export default Sidebar;
