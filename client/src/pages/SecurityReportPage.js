import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Container, Box, Paper, Typography, Button, Menu, MenuItem, Divider, List, ListItem, Card, CardContent, Pagination } from '@mui/material';

export default function SecurityReportPage() {
  const { restaurant_id } = useParams();
  const theme = useTheme();
  const [restaurantInfo, setRestaurantInfo] = useState({ name: 'Loading...', address: 'Loading...', securityScore: 'Pending' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dangerScore, setDangerScore] = useState(null);
  const [crimeDetails, setCrimeDetails] = useState([]);
  const [loadingCrimeDetails, setLoadingCrimeDetails] = useState(false);

  const crimeTypes = [
    'Murder', 'Homicide', 'Robbery', 'Assault', 'Narcotics', 'Prostitution',
    'Battery', 'Theft', 'Burglary', 'Motor vehicle theft', 'Arson',
    'Sex offense', 'Criminal damage', 'Weapons violation'
  ];

  const handleClick = (event, menuType) => {
    setAnchorEl({ ...anchorEl, [menuType]: event.currentTarget });
  };

  const handleClose = (menuType) => {
    setAnchorEl({ ...anchorEl, [menuType]: null });
  };

  const handleDistanceSelect = (distance) => {
    setSelectedDistance(distance);
    handleClose('distance');
    fetchCrimeDetails(distance, selectedType);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    handleClose('type');
    fetchCrimeDetails(selectedDistance, type);
  };

  const fetchCrimeDetails = (distance, type) => {
    setLoadingCrimeDetails(true);
    const distanceInMeters = { '0.1 km': 100, '0.5 km': 500, '1 km': 1000, '5 km': 5000 }[distance] || 1000; // Default to 1 km if none selected
    let url = `/getCrimeNearRes?resID=${restaurant_id}&distance=${distanceInMeters}`;
    if (type) {
      url += `&crimeType=${type}`;
    }
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setCrimeDetails(data.slice(0, 10).map(detail => ({
          ...detail,
          crime_date: new Date(detail.crime_date).toLocaleDateString(),
          crime_type: detail.crime_type.charAt(0).toUpperCase() + detail.crime_type.slice(1).toLowerCase(),
          crime_description: detail.crime_description.charAt(0).toUpperCase() + detail.crime_description.slice(1).toLowerCase(),
        })));
        setLoadingCrimeDetails(false);
      })
      .catch(error => {
        console.error('Failed to fetch crime details:', error);
        setLoadingCrimeDetails(false);
      });
  };

  const fetchRestaurantInfo = () => {
    fetch(`/getRestaurantInfo?resID=${restaurant_id}`)
      .then(response => response.json())
      .then(data => {
        setRestaurantInfo({
          name: data.restaurant_name,
          address: data.restaurant_address,
          securityScore: 'Loading...' // Placeholder until the score is fetched
        });
        // Fetch inspection score after fetching restaurant info
        fetchDangerScore();
      })
      .catch(error => console.error('Failed to fetch restaurant info:', error));
  };
  const fetchDangerScore = () => {
    fetch(`/getDangerScore?resID=${restaurant_id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setDangerScore(data.dangerScore); // Update state with fetched danger score
      })
      .catch(error => {
        console.error('Failed to fetch danger score:', error);
        setDangerScore('Error fetching score'); // Handle error state appropriately
      });
  };
  // Fetch Restaurant Information on component mount
  useEffect(() => {
    fetchRestaurantInfo();
    fetchDangerScore();
    if (selectedDistance && selectedType) {
      fetchCrimeDetails(selectedDistance, selectedType);
    }
    // You can add more functions to be called here if needed
  }, []);

  return (
    <Container sx={{ display: 'flex', flexDirection: 'row', pt: 4, bgcolor: theme.palette.background.default }}>
      <Box width="20%" minWidth="150px">
        <Button
          aria-controls="distance-menu"
          aria-haspopup="true"
          onClick={(e) => handleClick(e, 'distance')}
          sx={{ my: 2, width: '100%', bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.action.hover } }}
        >
          Select Distance
        </Button>
        <Menu
          id="distance-menu"
          anchorEl={anchorEl['distance']}
          keepMounted
          open={Boolean(anchorEl['distance'])}
          onClose={() => handleClose('distance')}
        >
          {['0.1 km', '0.5 km', '1 km', '5 km'].map((distance, index) => (
            <MenuItem key={index} onClick={() => handleDistanceSelect(distance)}>
              {distance}
            </MenuItem>
          ))}
        </Menu>
        <Button
          aria-controls="type-menu"
          aria-haspopup="true"
          onClick={(e) => handleClick(e, 'type')}
          sx={{ mt: 2, width: '100%', bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.action.hover } }}
        >
          Select Crime Type
        </Button>
        <Menu
          id="type-menu"
          anchorEl={anchorEl['type']}
          keepMounted
          open={Boolean(anchorEl['type'])}
          onClose={() => handleClose('type')}
        >
          {crimeTypes.map((type, index) => (
            <MenuItem key={index} onClick={() => handleTypeSelect(type)}>
              {type}
            </MenuItem>
          ))}
        </Menu>
        <Typography variant="body1" sx={{ mt: 2, mb: 2, color: theme.palette.text.secondary }}>
          {selectedDistance ? `Distance: ${selectedDistance}` : 'No distance selected'}{selectedType ? `, Type: ${selectedType}` : ''}
        </Typography>
      </Box>

      <Box width="80%" sx={{ ml: 2 }}>
        <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: '1.5rem', fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }}>
            {restaurantInfo.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontSize: '1.25rem' }}>
            {restaurantInfo.address}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Danger Score: {dangerScore !== null ? dangerScore.toFixed(2) : 'Loading...'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          {selectedDistance && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Security Details:</Typography>
              {loadingCrimeDetails ? (
                <Typography>Loading crime details...</Typography>
              ) : (
                <List>
                  {crimeDetails.map((detail, index) => (
                    <ListItem key={index}>
                      <Card sx={{ mb: 2, width: '100%' }}>
                        <CardContent>
                          <Typography variant="body2">
                            Date: {detail.crime_date}
                          </Typography>
                          <Typography variant="body2">
                            Type: {detail.crime_type}
                          </Typography>
                          <Typography variant="body2">
                            Description: {detail.crime_description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}  