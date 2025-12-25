import React from 'react';
import {
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    FormControlLabel,
    Checkbox,
    Box,
    Divider,
} from '@mui/material';
import { SearchFilters } from '../types/Parking';

interface FilterPanelProps {
    filters: SearchFilters;
    onFilterChange: (filters: SearchFilters) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange }) => {
    const handlePriceChange = (_event: Event, newValue: number | number[]) => {
        const maxPrice = Array.isArray(newValue) ? newValue[1] : newValue;
        onFilterChange({ ...filters, price_range: { min: 0, max: maxPrice } });
    };

    const handleEVToggle = () => {
        onFilterChange({
            ...filters,
            ev_filter: { enabled: !filters.ev_filter?.enabled }
        });
    };

    const handleAmenityToggle = (amenity: keyof NonNullable<SearchFilters['amenities']>) => {
        onFilterChange({
            ...filters,
            amenities: {
                ...filters.amenities,
                [amenity]: !filters.amenities?.[amenity]
            }
        });
    };

    const handleSortChange = (sort: SearchFilters['sort_by']) => {
        onFilterChange({ ...filters, sort_by: sort });
    };

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Filters
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* Sort Options */}
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="sort-select-label">Sort By</InputLabel>
                <Select
                    labelId="sort-select-label"
                    value={filters.sort_by || 'price_asc'}
                    label="Sort By"
                    onChange={(e) => handleSortChange(e.target.value as SearchFilters['sort_by'])}
                >
                    <MenuItem value="price_asc">Price: Low to High</MenuItem>
                    <MenuItem value="price_desc">Price: High to Low</MenuItem>
                    <MenuItem value="distance_asc">Distance: Nearest First</MenuItem>
                    <MenuItem value="distance_desc">Distance: Farthest First</MenuItem>
                    <MenuItem value="co2_asc">CO₂: Lowest First</MenuItem>
                    <MenuItem value="co2_desc">CO₂: Highest First</MenuItem>
                </Select>
            </FormControl>

            {/* Price Range */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Price Range: ${filters.price_range?.min || 0} - ${filters.price_range?.max || 100}/hr
                </Typography>
                <Slider
                    value={filters.price_range?.max || 100}
                    onChange={handlePriceChange}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `$${value}`}
                />
            </Box>

            {/* Amenity Toggles */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={600}>
                    Amenities
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.ev_filter?.enabled || false}
                                onChange={handleEVToggle}
                            />
                        }
                        label="🔌 EV Charging"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.amenities?.covered || false}
                                onChange={() => handleAmenityToggle('covered')}
                            />
                        }
                        label="🏠 Covered Parking"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.amenities?.cctv || false}
                                onChange={() => handleAmenityToggle('cctv')}
                            />
                        }
                        label="📹 CCTV Security"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.amenities?.free || false}
                                onChange={() => handleAmenityToggle('free')}
                            />
                        }
                        label="💰 Free Parking"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.amenities?.accessibility || false}
                                onChange={() => handleAmenityToggle('accessibility')}
                            />
                        }
                        label="♿ Accessibility"
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Only Available Toggle */}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.only_available || false}
                        onChange={() => onFilterChange({ ...filters, only_available: !filters.only_available })}
                    />
                }
                label={<Typography fontWeight={600}>Only show available spots</Typography>}
            />
        </Paper>
    );
};

export default FilterPanel;
