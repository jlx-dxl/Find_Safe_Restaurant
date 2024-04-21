import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Paper, Typography, Button, Menu, MenuItem, Divider, useTheme } from '@mui/material';

export default function SecurityReportPage() {
  const { restaurant_id } = useParams();
  const theme = useTheme(); // Access theme to adapt to light/dark mode dynamically
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Restaurant Name',
    address: 'Address',
    securityScore: 'Pending', // Placeholder security score
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState('');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDistanceSelect = (distance) => {
    setSelectedDistance(distance);
    setAnchorEl(null);
    // Simulate fetching security details based on distance
    // Placeholder for actual fetching logic
  };

  useEffect(() => {
    // Placeholder for actual fetching logic
  }, [restaurant_id]);

  return (
    <Container sx={{ display: 'flex', flexDirection: 'row', pt: 4, bgcolor: theme.palette.background.default }}>
      <Box width="20%" minWidth="150px">
        <Button
          aria-controls="distance-menu"
          aria-haspopup="true"
          onClick={handleClick}
          sx={{ my: 2, width: '100%', bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.action.hover } }}
        >
          Select Distance
        </Button>
        <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
          {selectedDistance ? `Selected: ${selectedDistance}` : 'No distance selected'}
        </Typography>
        <Menu
          id="distance-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {['0.5 miles', '1 mile', '5 miles', '10 miles'].map((distance, index) => (
            <MenuItem key={index} onClick={() => handleDistanceSelect(distance)}>
              {distance}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Box width="80%" sx={{ ml: 2 }}>
        <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: '1.5rem', fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }}>
            {restaurantInfo.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontSize: '1.25rem' }}>
            {restaurantInfo.address}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: '1rem', color: theme.palette.text.secondary }}>
            Security Score: {restaurantInfo.securityScore}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {selectedDistance && (
            <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.primary }}>
              Security details for {selectedDistance} will be displayed here.
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

