import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Paper, Typography, Button, Menu, MenuItem, Divider, useTheme } from '@mui/material';

export default function InspectionReportPage() {
  const { restaurant_id } = useParams();
  const theme = useTheme(); // Access theme to adapt to light/dark mode dynamically
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Restaurant Name',
    address: 'Address',
    inspectionScore: 10,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTimePeriodSelect = (timePeriod) => {
    setSelectedTimePeriod(timePeriod);
    setAnchorEl(null);
    // Simulate fetching inspection details based on time period
    // Placeholder for actual fetching logic
  };

  useEffect(() => {
    // Placeholder for actual fetching logic
  }, [restaurant_id]);

  return (
    <Container sx={{ display: 'flex', flexDirection: 'row', pt: 4, bgcolor: theme.palette.background.default }}>
      <Box width="20%" minWidth="150px">
        <Button
          aria-controls="time-period-menu"
          aria-haspopup="true"
          onClick={handleClick}
          sx={{ my: 2, width: '100%', bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.action.hover } }}
        >
          Select Time Period
        </Button>
        <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
          {selectedTimePeriod ? `Selected: ${selectedTimePeriod}` : 'No period selected'}
        </Typography>
        <Menu
          id="time-period-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {['1 month', '6 months', '1 year', 'All data'].map((period, index) => (
            <MenuItem key={index} onClick={() => handleTimePeriodSelect(period)}>
              {period}
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
            Inspection Score: {restaurantInfo.inspectionScore}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {selectedTimePeriod && (
            <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.primary }}>
              Inspection details for {selectedTimePeriod} will be displayed here.
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
