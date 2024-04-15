import { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText } from '@mui/material';
const config = require('../config.json');


export default function NearByRestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [sortType, setSortType] = useState('score');
  const [distanceFilter, setDistanceFilter] = useState(10);

  useEffect(() => {
    // TODO: Fetch restaurant data from the server and apply the sort type and distance filter
    // setRestaurants(fetchedRestaurants);
  }, [sortType, distanceFilter]);

  const handleSortChange = (event) => {
    setSortType(event.target.value);
  };

  const handleDistanceChange = (event, newValue) => {
    setDistanceFilter(newValue);
  };

  // Placeholder data structure for list items
  const restaurantListItems = restaurants.map((restaurant) =>
    <ListItem key={restaurant.id}>
      <ListItemText primary={restaurant.name} secondary={`Distance: ${restaurant.distance} km`} />
    </ListItem>
  );

  return (
    <Container>
      <Grid container spacing={2}>
        {/* Filter Area */}
        <Grid item xs={3}>
          <Typography variant="h6">Filters</Typography>
          {/* Placeholder for additional filters */}
          <Typography>Distances</Typography>
          {/* Replace this with a slider if needed */}
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
              {/* Add more options as needed */}
            </Select>
          </FormControl>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={9}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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