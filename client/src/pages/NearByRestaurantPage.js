import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Pagination from '@mui/material/Pagination';
import {
    Container, Grid, Typography, Box, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText, Card, CardActionArea
} from '@mui/material';
import { Link } from 'react-router-dom';

export default function NearByRestaurantPage() {
    const { restaurant_id } = useParams();
    const [restaurants, setRestaurants] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [sortType, setSortType] = useState('distance');
    const [distanceFilter, setDistanceFilter] = useState(1); // Default set to 1 km
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const fetchNearbyRestaurants = async () => {
            try {
                const response = await fetch(`/getNearbyRestaurant?resID=${restaurant_id}&distance=${distanceFilter}&page=${page}&pageSize=${pageSize}&sortType=${sortType}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setRestaurants(data);
                setTotalPages(Math.ceil(data.totalCount / pageSize));  // Assumes totalCount is provided by API
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        fetchNearbyRestaurants();
    }, [restaurant_id, sortType, distanceFilter, page, pageSize]);

    const handleSortChange = (event) => {
        setSortType(event.target.value);
    };

    const handleDistanceChange = (event) => {
        setDistanceFilter(event.target.value);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };


    return (
        <Container>
            <Grid container spacing={2}>
                {/* Sticky Filter Area */}
                <Grid item xs={12} sm={4} md={3} sx={{ position: 'sticky', top: 100, alignSelf: 'flex-start' }}> {/* Adjust 'top' to align below the title */}
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium', mt: 2 }}> {/* mt (margin-top) can be adjusted as needed */}
                        Filters
                    </Typography>
                    <Box mb={2}>
                        <FormControl fullWidth>
                            <InputLabel>Distance</InputLabel>
                            <Select
                                value={distanceFilter}
                                label="Distance"
                                onChange={handleDistanceChange}
                            >
                                <MenuItem value={1}>{"< 1 km"}</MenuItem>
                                <MenuItem value={5}>{"< 5 km"}</MenuItem>
                                <MenuItem value={10}>{"< 10 km"}</MenuItem>
                                <MenuItem value={20}>{"< 20 km"}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box mb={2}>
                        <FormControl fullWidth>
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                value={sortType}
                                label="Sort by"
                                onChange={handleSortChange}
                            >
                                <MenuItem value="distance">Distance</MenuItem>
                                <MenuItem value="score">Score</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
    
                {/* Main Content Area */}
                <Grid item xs={12} sm={8} md={9}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
                        Nearby Restaurant Recommendations
                    </Typography>
                    {restaurants.map((restaurant) => (
                        <Card key={restaurant.restaurant_id} sx={{ mb: 2, padding: 2, boxShadow: 1, '&:hover': { boxShadow: 4 }, borderRadius: 2 }}>
                            <CardActionArea>
                                <Link to={`/restaurant/${restaurant.restaurant_id}`} style={{ textDecoration: 'none' }}>
                                    <Box sx={{ padding: '16px' }}>
                                        <Typography gutterBottom variant="h6" component="div" sx={{ color: 'primary.main' }}>
                                            {restaurant.restaurant_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Distance: {restaurant.distance.toFixed(2)} km
                                        </Typography>
                                    </Box>
                                </Link>
                            </CardActionArea>
                        </Card>
                    ))}
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        boundaryCount={1}
                        siblingCount={1}
                        showFirstButton
                        showLastButton
                        variant="outlined"
                        shape="rounded"
                        sx={{ mt: 4 }}
                    />
                </Grid>
            </Grid>
        </Container>
    );
    
}
