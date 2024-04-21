import { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import { Link } from 'react-router-dom';

export default function NearByRestaurantPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [sortType, setSortType] = useState('score');
    const [distanceFilter, setDistanceFilter] = useState(10);

    // Fetch restaurant data when sortType or distanceFilter changes
    useEffect(() => {
        // Simulate fetching data from an API
        fetch(`/api/restaurants?sortType=${sortType}&distanceFilter=${distanceFilter}`)
            .then(response => response.json())
            .then(data => {
                setRestaurants(data);
            })
            .catch(error => console.error('Failed to fetch data:', error));
    }, [sortType, distanceFilter]);

    const handleSortChange = (event) => {
        setSortType(event.target.value);
    };

    const handleDistanceChange = (event) => {
        setDistanceFilter(event.target.value);
    };

    // Render the list of restaurants
    const restaurantListItems = restaurants.map((restaurant) => (
        <ListItem key={restaurant.id}>
            <Link to={`/restaurant?id=${restaurant.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItemText primary={restaurant.name}
                              secondary={`Distance: ${restaurant.distance} km, Score: ${restaurant.score}`} />
            </Link>
        </ListItem>
    ));

    return (
        <Container>
            <Grid container spacing={2}>
                {/* Filter Area */}
                <Grid item xs={3}>
                    <Typography variant="h6">Filters</Typography>
                    {/* Distance Filter */}
                    <FormControl fullWidth>
                        <InputLabel>Distance</InputLabel>
                        <Select
                            value={distanceFilter}
                            label="Distance"
                            onChange={handleDistanceChange}
                        >
                            <MenuItem value={5}>{"< 5 km"}</MenuItem>
                            <MenuItem value={10}>{"< 10 km"}</MenuItem>
                            <MenuItem value={20}>{"< 20 km"}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Main Content Area */}
                <Grid item xs={9}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '10px'
                    }}>
                        <Typography variant="h5">Nearby Restaurant Recommendations</Typography>
                        <FormControl>
                            <InputLabel id="sort-label">Sort</InputLabel>
                            <Select
                                labelId="sort-label"
                                id="sort-select"
                                value={sortType}
                                label="Sort"
                                onChange={handleSortChange}
                            >
                                <MenuItem value="score">Score</MenuItem>
                                <MenuItem value="distance">Distance</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <List>
                        {restaurantListItems}
                    </List>
                </Grid>
            </Grid>
        </Container>
    );
}
