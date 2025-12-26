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
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

    useEffect(() => {
        const initService = () => {
            if (window.google && window.google.maps && window.google.maps.places && !autocompleteService.current) {
                autocompleteService.current = new window.google.maps.places.AutocompleteService();
            }
        };

        if (!autocompleteService.current) {
            initService();
        }

        if (value.length > 2) {
            if (!autocompleteService.current) {
                initService();
            }

            if (autocompleteService.current) {
                autocompleteService.current.getPlacePredictions(
                    { input: value, types: ['geocode', 'establishment'] },
                    (predictions, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSuggestions(predictions);
                            setShowSuggestions(true);
                        } else {
                            setSuggestions([]);
                        }
                    }
                );
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
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

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                <InputBase
                    sx={{
                        ml: 1,
                        flex: 1,
                        height: 56,
                        fontSize: '1rem',
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
                />
                <IconButton type="button" sx={{ p: '10px', color: '#00d4aa' }} aria-label="search" onClick={onSearch}>
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
