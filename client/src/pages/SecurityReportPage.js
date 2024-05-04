import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Container, Box, Paper, Typography, Button, Menu, MenuItem, Divider, List, ListItem, Card, CardContent } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Bar } from 'react-chartjs-2';

export default function SecurityReportPage() {
  const { restaurant_id } = useParams();
  const theme = useTheme();
  const [restaurantInfo, setRestaurantInfo] = useState({ name: 'Loading...', address: 'Loading...', securityScore: 'Pending' });
  const [anchorEl, setAnchorEl] = useState({});
  const [selectedDistance, setSelectedDistance] = useState('0.1 km');
  const [selectedType, setSelectedType] = useState('');
  const [dangerScore, setDangerScore] = useState(null);
  const [crimeDetails, setCrimeDetails] = useState([]);
  const [loadingCrimeDetails, setLoadingCrimeDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2016'); // Default to 2016
  const [totalCrimes, setTotalCrimes] = useState(0);
  const [isTypeAnalysisOpen, setIsTypeAnalysisOpen] = useState(false);

  const [barPlotData, setBarPlotData] = useState({
    labels: [],
    datasets: [{
      label: 'Number of Crimes',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  });
  const handleOpenTypeAnalysis = () => {
    setIsTypeAnalysisOpen(true);
  };
  const handleCloseTypeAnalysis = () => {
    setIsTypeAnalysisOpen(false);
  };

  const processCrimeDataForBarPlot = (crimeData, selectedYear) => {
    const initialCrimeCounts = crimeTypes.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {});

    const crimeCounts = crimeData.reduce((acc, crime) => {
      if (crime.crime_type && crime.crime_date.startsWith(selectedYear)) {
        const type = crime.crime_type.charAt(0).toUpperCase() + crime.crime_type.slice(1).toLowerCase();
        if (acc[type] !== undefined) {
          acc[type] += 1;
        }
      }
      return acc;
    }, initialCrimeCounts);

    setBarPlotData({
      labels: crimeTypes,
      datasets: [{
        label: 'Number of Crimes',
        data: Object.values(crimeCounts),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    });
  };

  const crimeTypes = [
    'Murder', 'Homicide', 'Robbery', 'Assault', 'Battery', 'Theft', 'Weapons Violation', 
    'Motor Vehicle Theft', 'Criminal Damage', 'Other Offense', 'Deceptive Practice', 
    'Criminal Trespass', 'Burglary', 'Stalking', 'Narcotics', 'Crim Sexual Assault', 'Other'    
  ];

  const handleClick = (event, menuType) => {
    setAnchorEl(prevState => ({ ...anchorEl, [menuType]: event.currentTarget }));
  };

  const handleClose = (menuType) => {
    setAnchorEl(prevState => ({ ...anchorEl, [menuType]: null }));
  };

  const handleDistanceSelect = (distance) => {
    setSelectedDistance(distance);
    handleClose('distance');
    fetchAllData(distance, selectedType); // Changed from fetchCrimeDetails to fetchAllData
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type === 'ALL' ? '' : type);
    handleClose('type');
    fetchAllData(selectedDistance, type === 'ALL' ? '' : type, selectedYear); // Changed from fetchCrimeDetails to fetchAllData
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    handleClose('year');
    fetchAllData(selectedDistance, selectedType, year); // Now includes year in the fetch
  };

  const fetchAllData = async (distance, type, year) => {
    console.log('Fetching data with filters:', { distance, type, year });
    setLoading(true);
    const distanceInMeters = { '0.1 km': 0.1, '0.5 km': 0.5, '1 km': 1, '5 km': 5 }[distance];

    let crimeUrl = `/getCrimeNearRes?resID=${restaurant_id}&distance=${distanceInMeters}`;
    if (type) {
      crimeUrl += `&crimeType=${type}`;
    }
    if (year) {
      crimeUrl += `&crimeYear=${year}`;
    }

    try {
      const [infoResponse, scoreResponse, crimeResponse] = await Promise.all([
        fetch(`/getRestaurantInfo?resID=${restaurant_id}`),
        fetch(`/getSafetyScore?resID=${restaurant_id}`),
        fetch(crimeUrl)
      ]);

      const [infoData, scoreData, crimeData] = await Promise.all([
        infoResponse.json(),
        scoreResponse.json(),
        crimeResponse.json()
      ]);

      setRestaurantInfo({
        name: infoData.restaurant_name,
        address: infoData.restaurant_address,
        securityScore: infoData.securityScore || 'Pending'
      });

      setDangerScore(scoreData.safetyScore);

      setCrimeDetails(crimeData.slice(0, 10).map(detail => ({
        ...detail,
        crime_date: new Date(detail.crime_date).toLocaleDateString(),
        crime_type: detail.crime_type.charAt(0).toUpperCase() + detail.crime_type.slice(1).toLowerCase(),
        crime_description: detail.crime_description.charAt(0).toUpperCase() + detail.crime_description.slice(1).toLowerCase(),
        distance: detail.distance.toFixed(3),
      })));

      setTotalCrimes(crimeData.length);
      processCrimeDataForBarPlot(crimeData, year);
      console.log('Total crimes set to:', crimeData.length);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch all initial data on component mount with the default or previously selected values
    fetchAllData(selectedDistance, selectedType, selectedYear);
  }, [selectedDistance, selectedType, selectedYear]); // Include selectedYear in the dependency array

  if (loading) {
    return <div>Loading...</div>; // Display loading indicator while data is fetching
  }


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
          sx={{ mt: 0.5, width: '100%', bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.action.hover } }}
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
          <MenuItem key="all" onClick={() => handleTypeSelect('ALL')}>
            ALL
          </MenuItem>
          {crimeTypes.map((type, index) => (
            <MenuItem key={index} onClick={() => handleTypeSelect(type)}>
              {type}
            </MenuItem>
          ))}
        </Menu>
        <Button
          aria-controls="year-menu"
          aria-haspopup="true"
          onClick={(e) => handleClick(e, 'year')}
          sx={{ mt: 2, width: '100%', bgcolor: theme.palette.background.paper, '&:hover': { bgcolor: theme.palette.action.hover } }}
        >
          Select Year
        </Button>
        <Menu
          id="year-menu"
          anchorEl={anchorEl['year']}
          keepMounted
          open={Boolean(anchorEl['year'])}
          onClose={() => handleClose('year')}
        >
          {['2012', '2013', '2014', '2015', '2016'].map((year, index) => (
            <MenuItem key={index} onClick={() => handleYearSelect(year)}>
              {year}
            </MenuItem>
          ))}
        </Menu>
        {/* This Typography below will now be the only one that displays the selected filters */}
        <Box sx={{ mt: 2 }}>
          {selectedDistance && (
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Distance: {selectedDistance}
            </Typography>
          )}
          {selectedType && (
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Type: {selectedType}
            </Typography>
          )}
          {selectedYear && (
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Year: {selectedYear}
            </Typography>

          )}
          <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            Total Crimes: {totalCrimes}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={handleOpenTypeAnalysis}
        >
          Type Analysis
        </Button>
        <Dialog open={isTypeAnalysisOpen} onClose={handleCloseTypeAnalysis} fullWidth={true} maxWidth="md">
          <DialogTitle>
            Type Analysis - {selectedYear}  {/* Here is the change */}
            <IconButton
              aria-label="close"
              onClick={handleCloseTypeAnalysis}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {/* Render the bar chart here */}
            <Bar
              key={selectedYear}
              data={barPlotData}
              options={{
                scales: {
                  y: {
                    beginAtZero: true
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  }
                }
              }}
            />
          </DialogContent>
        </Dialog>
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
                          <Typography variant="body2">
                            Distance: {detail.distance} km
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
    </Container >
  );
}