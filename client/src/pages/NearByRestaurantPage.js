import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Grid, Typography, Box, Select, MenuItem, FormControl, InputLabel, Card, CardActionArea } from '@mui/material';
import Pagination from '@mui/material/Pagination';

export default function NearByRestaurantPage() {
    const { restaurant_id } = useParams();
    const [restaurants, setRestaurants] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [sortType, setSortType] = useState('distance');
    const [sortOrder, setSortOrder] = useState('asc');
    const [distanceFilter, setDistanceFilter] = useState(1);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const fetchNearbyRestaurants = async () => {
            try {
                const response = await fetch(`/getNearbyRestaurant?resID=${restaurant_id}&distance=${distanceFilter}&page=${page}&pageSize=${pageSize}&sortType=${sortType}&sortOrder=${sortOrder}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const { restaurants, totalPages } = await response.json();
                setRestaurants(restaurants);
                setTotalPages(Math.ceil(totalPages / pageSize));
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        fetchNearbyRestaurants();
    }, [restaurant_id, sortType, sortOrder, distanceFilter, page, pageSize]);

    const handleSortChange = (event) => {
        setSortType(event.target.value);
    };

    const handleSortOrderChange = (event) => {
        setSortOrder(event.target.value);
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
                <Grid item xs={12} sm={4} md={3} sx={{ position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium', mt: 2 }}>
                        Filters
                    </Typography>
                    <Box mb={2}>
                        <FormControl fullWidth>
                            <InputLabel>Distance</InputLabel>
                            <Select value={distanceFilter} label="Distance" onChange={handleDistanceChange}>
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
                            <Select value={sortType} label="Sort by" onChange={handleSortChange}>
                                <MenuItem value="distance">Distance</MenuItem>
                                <MenuItem value="overallScore">Score</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box mb={2}>
                        <FormControl fullWidth>
                            <InputLabel>Order</InputLabel>
                            <Select value={sortOrder} label="Order" onChange={handleSortOrderChange}>
                                <MenuItem value="asc">Ascending</MenuItem>
                                <MenuItem value="desc">Descending</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
    
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
                                        <Typography variant="body2" color="text.secondary">
                                            Score: {restaurant.overallScore.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Link>
                            </CardActionArea>
                        </Card>
                    ))}
                    <Pagination count={totalPages} page={page} onChange={handlePageChange} boundaryCount={1} siblingCount={1} showFirstButton showLastButton variant="outlined" shape="rounded" sx={{ mt: 4 }} />
                </Grid>
            </Grid>
        </Container>
    );
}
