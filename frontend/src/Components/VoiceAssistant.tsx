import React, { useEffect, useState } from 'react';
import { Box, Fab, Typography, Modal, Fade, Paper, useTheme } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { useVoice } from '../context/VoiceContext';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(0, 212, 170, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 212, 170, 0); }
`;

const wave = keyframes`
  0% { height: 10px; }
  50% { height: 30px; }
  100% { height: 10px; }
`;
const WAVE_BARS = [1, 2, 3, 4, 5];

const VoiceAssistant: React.FC = () => {
    const { isListening, transcript, startListening, stopListening, feedback, isSupported } = useVoice();
    const [open, setOpen] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        if (isListening) {
            setOpen(true);
        }
    }, [isListening]);

    // Auto-close modal after feedback (if not listening)
    useEffect(() => {
        if (!isListening && !feedback) {
            const timer = setTimeout(() => {
                setOpen(false);
            }, 500); // Quick close if idle
            return () => clearTimeout(timer);
        }

        if (!isListening && feedback) {
            const timer = setTimeout(() => {
                setOpen(false); // Close after showing result 
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isListening, feedback]);

    if (!isSupported) return null; // Hide if browser doesn't support API

    const handleToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
            setOpen(true);
        }
    };

    return (
        <>
            <Fab
                color="primary"
                aria-label="voice assistant"
                onClick={handleToggle}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1300,
                    background: 'linear-gradient(45deg, #00d4aa 30%, #00b09b 90%)',
                    boxShadow: isListening ? '0 0 20px rgba(0,212,170,0.6)' : theme.shadows[4],
                    animation: isListening ? `${pulse} 2s infinite` : 'none',
                }}
            >
                {isListening ? <GraphicEqIcon /> : <MicIcon />}
            </Fab>

            <Modal
                open={open}
                onClose={() => {
                    stopListening();
                    setOpen(false);
                }}
                closeAfterTransition
                BackdropProps={{
                    timeout: 500,
                    style: { backgroundColor: 'rgba(0,0,0,0.4)' } // Subtle dimmed background
                }}
            >
                <Fade in={open}>
                    <Paper
                        elevation={24}
                        sx={{
                            position: 'absolute',
                            bottom: 100,
                            right: 24,
                            width: 320,
                            p: 3,
                            borderRadius: 4,
                            background: 'rgba(23, 23, 23, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            outline: 'none',
                        }}
                    >
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                            ParkSync Voice
                        </Typography>

                        {/* Visualizer / Waveform */}
                        <Box sx={{ display: 'flex', gap: 0.5, height: 40, alignItems: 'center', mb: 2 }}>
                            {WAVE_BARS.map((i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        width: 6,
                                        height: 10,
                                        bgcolor: '#00d4aa',
                                        borderRadius: 1,
                                        animation: isListening ? `${wave} 1s infinite ${i * 0.1}s ease-in-out` : 'none',
                                        opacity: isListening ? 1 : 0.3
                                    }}
                                />
                            ))}
                        </Box>

                        <Typography
                            variant="body1"
                            align="center"
                            sx={{
                                color: isListening ? '#fff' : 'text.secondary',
                                minHeight: '24px',
                                fontStyle: transcript ? 'normal' : 'italic',
                                mb: 1
                            }}
                        >
                            {transcript || (isListening ? "Listening..." : "Tab mic to speak")}
                        </Typography>

                        {feedback && (
                            <Typography variant="caption" sx={{ color: '#00d4aa', fontWeight: 'bold' }}>
                                {feedback}
                            </Typography>
                        )}

                        {!isListening && !feedback && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                                Try "Find parking", "Go Home", "My Wallet"
                            </Typography>
                        )}
                    </Paper>
                </Fade>
            </Modal>
        </>
    );
};

export default VoiceAssistant;
