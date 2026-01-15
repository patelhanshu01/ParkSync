import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    InputBase,
    Paper,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    compact?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, compact = false }) => {
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const debounceRef = useRef<number | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const initService = () => {
            if (window.google && window.google.maps && window.google.maps.places && !autocompleteService.current) {
                autocompleteService.current = new window.google.maps.places.AutocompleteService();
            }
        };

        if (!autocompleteService.current) {
            initService();
        }

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        if (value.length > 2) {
            if (!autocompleteService.current) {
                initService();
            }

            if (autocompleteService.current) {
                const requestId = ++requestIdRef.current;
                debounceRef.current = window.setTimeout(() => {
                    autocompleteService.current?.getPlacePredictions(
                        { input: value, types: ['geocode', 'establishment'] },
                        (predictions, status) => {
                            if (requestId !== requestIdRef.current) return;
                            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                                setSuggestions(predictions);
                                setShowSuggestions(true);
                            } else {
                                setSuggestions([]);
                            }
                        }
                    );
                }, 250);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
        };
    }, [value]);

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        if (onSearch) {
            setTimeout(() => onSearch(), 10);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
            setShowSuggestions(false);
        }
    };

    const inputHeight = compact ? 44 : 56;
    const inputFontSize = compact ? '0.95rem' : '1rem';
    const iconPadding = compact ? '8px' : '10px';
    const horizontalPadding = compact ? 1.5 : 2;

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', px: horizontalPadding }}>
                <InputBase
                    sx={{
                        ml: 1,
                        flex: 1,
                        height: inputHeight,
                        fontSize: inputFontSize,
                        color: '#ffffff',
                        '& ::placeholder': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            opacity: 1
                        }
                    }}
                    placeholder="Search destinations or parking..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 300);
                    }}
                    inputProps={{ 'aria-label': 'search parking locations' }}
                />
                <IconButton type="button" sx={{ p: iconPadding, color: '#00d4aa' }} aria-label="search" onClick={onSearch}>
                    <SearchIcon />
                </IconButton>
            </Box>

            {showSuggestions && suggestions.length > 0 && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        maxHeight: 300,
                        overflowY: 'auto',
                        zIndex: 1000,
                        borderRadius: 3
                    }}
                >
                    <List sx={{ py: 1 }}>
                        {suggestions.map((suggestion, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <Divider variant="inset" component="li" />}
                                <ListItemButton
                                    onClick={() => handleSuggestionClick(suggestion.description)}
                                    sx={{ py: 1.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <LocationOnIcon fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={suggestion.description}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItemButton>
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default SearchBar;
