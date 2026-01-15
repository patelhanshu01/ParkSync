import React, { useState } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    Link,
    InputAdornment,
    IconButton,
    Divider,
    Chip,
    Stack
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const float = keyframes`
  0% { transform: translateY(0px); opacity: 0.9; }
  50% { transform: translateY(-10px); opacity: 1; }
  100% { transform: translateY(0px); opacity: 0.9; }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 0px 0 rgba(56, 189, 248, 0.3); }
  50% { box-shadow: 0 0 25px 8px rgba(56, 189, 248, 0.12); }
  100% { box-shadow: 0 0 0px 0 rgba(56, 189, 248, 0.3); }
`;

const HERO_SLIDES = [
    {
        title: 'Find the best bay fast',
        desc: 'Realtime availability with smart recommendations for your vehicle type.',
        badge: 'Smart search'
    },
    {
        title: 'Scan, pay, glide out',
        desc: 'One-tap payments and QR passes keep your exit smooth and quick.',
        badge: 'Frictionless'
    },
    {
        title: 'Multi-floor ready',
        desc: 'Navigate between levels with guided arrows and clear labels.',
        badge: 'Guided'
    }
];

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, googleLogin, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
            const target =
                from && from !== '/login' && from !== '/signup' && from !== '/'
                    ? from
                    : '/';
            navigate(target, { replace: true });
        } catch (err) {
            // Error handling is managed by AuthContext
        }
    };

    return (
        <Container component="main" maxWidth="lg">
            <Box
                sx={{
                    mt: { xs: 4, md: 8 },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
                    gap: 3,
                    alignItems: 'stretch'
                }}
            >
                {/* Swiper hero */}
                <Paper elevation={4} sx={{ p: 0, overflow: 'hidden', borderRadius: 3, minHeight: 520, position: 'relative' }}>
                    <Swiper
                        modules={[Pagination, Autoplay, EffectFade]}
                        pagination={{ clickable: true }}
                        effect="fade"
                        autoplay={{ delay: 3800, disableOnInteraction: false }}
                        style={{ height: '100%' }}
                    >
                        {HERO_SLIDES.map((slide, idx) => (
                            <SwiperSlide key={idx}>
                                <Box
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        gap: 3,
                                        p: { xs: 4, md: 5 },
                                        background: 'linear-gradient(135deg, #081021 0%, #0c182c 45%, #081021 100%)',
                                        color: '#e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Ambient glow */}
                                    <Box sx={{
                                        position: 'absolute',
                                        width: 220,
                                        height: 220,
                                        top: 40,
                                        right: -60,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(56,189,248,0.35), transparent 65%)',
                                        filter: 'blur(8px)',
                                        animation: `${float} 8s ease-in-out infinite`
                                    }} />
                                    <Box sx={{
                                        position: 'absolute',
                                        width: 180,
                                        height: 180,
                                        bottom: -40,
                                        left: -20,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(129,140,248,0.28), transparent 70%)',
                                        filter: 'blur(10px)',
                                        animation: `${float} 9s ease-in-out infinite reverse`
                                    }} />

                                    <Chip label={slide.badge} color="primary" sx={{ alignSelf: 'flex-start' }} />
                                    <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}>
                                        {slide.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                                        {slide.desc}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <Chip label="Secure" variant="outlined" sx={{ color: '#8ce0ff', borderColor: 'rgba(140,224,255,0.5)' }} />
                                        <Chip label="24/7 access" variant="outlined" sx={{ color: '#c084fc', borderColor: 'rgba(192,132,252,0.4)' }} />
                                    </Stack>

                                    {/* CO2 savings widget */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            mt: 2,
                                            p: 2,
                                            borderRadius: 2,
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            background: 'rgba(12,18,36,0.75)',
                                            backdropFilter: 'blur(8px)',
                                            display: 'grid',
                                            gap: 1.2,
                                            color: 'white',
                                            animation: `${glow} 5s ease-in-out infinite`
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip size="small" label="CO₂ savings" color="success" />
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>vs. circling for parking</Typography>
                                        </Stack>
                                        <Typography variant="h4" fontWeight={800}>-32%</Typography>
                                        <Box sx={{ position: 'relative', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
                                            <Box sx={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '72%',
                                                borderRadius: 999,
                                                background: 'linear-gradient(90deg, #22d3ee, #34d399)',
                                                animation: `${float} 6s ease-in-out infinite`
                                            }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Live estimate based on guided routing and reduced idle time.
                                        </Typography>
                                    </Paper>
                                </Box>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Paper>

                {/* Form */}
                <Paper elevation={6} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography component="h1" variant="h4" fontWeight="800" color="primary">
                            ParkSync
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Sign in to continue
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 700 }}
                        >
                            Sign In
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link component={RouterLink} to="/signup" variant="body2">
                                {"Don't have an account? Sign Up"}
                            </Link>
                        </Box>

                        <Divider sx={{ my: 3 }}>OR</Divider>

                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                                onSuccess={credentialResponse => {
                                    if (credentialResponse.credential) {
                                        googleLogin(credentialResponse.credential)
                                            .then(() => {
                                                const target =
                                                    from && from !== '/login' && from !== '/signup' && from !== '/'
                                                        ? from
                                                        : '/';
                                                navigate(target, { replace: true });
                                            })
                                            .catch((err) => console.error("Google Login Error", err));
                                    }
                                }}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
