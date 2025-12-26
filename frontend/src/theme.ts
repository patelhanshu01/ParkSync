import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00d4aa', // Teal/green accent from mockup
            light: '#34e5c8',
            dark: '#00b894',
            contrastText: '#0a1929',
        },
        secondary: {
            main: '#5fb3f6', // Blue accent
            light: '#7ec4ff',
            dark: '#3d9ae0',
        },
        background: {
            default: '#0a1929', // Dark navy from mockup
            paper: '#1a2332', // Slightly lighter for cards
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0bec5',
        },
        divider: 'rgba(255, 255, 255, 0.12)',
        success: {
            main: '#00d4aa',
            light: '#34e5c8',
            dark: '#00b894',
        },
        error: {
            main: '#ff4757',
            light: '#ff6b7a',
            dark: '#ee2f3f',
        },
        warning: {
            main: '#ffa502',
            light: '#ffc048',
            dark: '#ff8c00',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            color: '#ffffff',
        },
        h2: {
            fontWeight: 700,
            color: '#ffffff',
        },
        h3: {
            fontWeight: 600,
            color: '#ffffff',
        },
        h4: {
            fontWeight: 600,
            color: '#ffffff',
        },
        h5: {
            fontWeight: 600,
            color: '#ffffff',
        },
        h6: {
            fontWeight: 600,
            color: '#ffffff',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 212, 170, 0.2)',
                    },
                },
                contained: {
                    background: 'linear-gradient(135deg, #00d4aa 0%, #34e5c8 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #00b894 0%, #00d4aa 100%)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backgroundColor: '#1a2332',
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#0a1929',
                    backgroundImage: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#0a1929',
                    backgroundImage: 'none',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                },
            },
        },
    },
});

export default theme;
