import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Paper, Stack, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
const config = require('../config.json');

export default function InspectionReportPage() {
  const { restaurant_id } = useParams();

  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Restaurant Name', // Placeholder name
    address: 'Address', // Placeholder address
    InspectionScore: 10, // Placeholder security score
    // Additional restaurant data goes here
  });

  // This placeholder data array could hold information regarding filters or statistics
  const [filters, setFilters] = useState([
    // Example filter item
    { name: 'Time', options: ['1 month', '1 year', '2 year'] },
  ]);

  // Placeholder effect for fetching restaurant info
  // useEffect(() => {
  //   fetch(/* API endpoint */)
  //     .then(res => res.json())
  //     .then(resJson => setRestaurantInfo(resJson));
  // }, [restaurant_id]);

  // Placeholder for a function to apply a filter
  // You'll need to implement this based on how your data is structured
  const applyFilter = (filter) => {
    console.log(`Applying filter: ${filter}`);
  };

  return (
    <Container sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
      {/* Filters Sidebar */}
      <Box width="20%" minWidth="150px">
        <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
        <List>
          {filters.map((filter, index) => (
            <ListItem button key={index} onClick={() => applyFilter(filter.name)}>
              <ListItemText primary={filter.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Content Area */}
      <Box width="80%" sx={{ ml: 2 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4">{restaurantInfo.name}</Typography>
          <Typography variant="subtitle1">{restaurantInfo.address}</Typography>
          <Typography variant="body1">Inspection Score: {restaurantInfo.InspectionScore}</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">Statistics</Typography>
          {/* Todo list here */}
          <List>
            <ListItem>
              <ListItemText primary="Todo: Need a filter searching page? (based on different year?)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Todo: List crimes?" />
            </ListItem>
            {/* More todos can be added here */}
          </List>
        </Paper>
      </Box>
    </Container>
  );
}