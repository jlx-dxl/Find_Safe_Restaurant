import { useEffect, useState } from 'react';
import { Box, Container, Button} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const config = require('../config.json');
export default function RestaurantInfoPage() {
  let { restaurantId } = useParams();
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Restaurant Name', // Placeholder name
    address: 'Address', // Placeholder address
    overallScore: 'TODO: define overall score', // Placeholder overall score
    inspectionScore: 'X?', // Placeholder inspection score
    securityScore: 'X?', // Placeholder security score
  });

  // Placeholder effect for fetching restaurant info
  // useEffect(() => {
  //   fetch(/* API endpoint */)
  //     .then(res => res.json())
  //     .then(resJson => setRestaurantInfo(resJson));
  // }, []);

  return (
    <Container>
      <Box sx={{ my: 4, p: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
        <h1>{restaurantInfo.name}</h1>
        <p>{restaurantInfo.address}</p>
        <p>Overall Restaurant Score: {restaurantInfo.overallScore}</p>
        <p>Inspection Score: {restaurantInfo.inspectionScore}</p>
        <p>Security Score: {restaurantInfo.securityScore}</p>
        <Button variant="contained" color="primary" sx={{ my: 1 }}>
          Check Security Report
        </Button>
        <Button variant="contained" color="primary" sx={{ my: 1 }}>
          Check Inspection Report
        </Button>
        <Button variant="contained" color="secondary" sx={{ my: 1 }}>
          Check Nearby Better Restaurant
        </Button>
      </Box>
    </Container>
  );
}