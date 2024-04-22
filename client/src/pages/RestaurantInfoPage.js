import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Box, Button, Typography } from '@mui/material';

export default function RestaurantInfoPage() {
    const { restaurant_id } = useParams(); // Ensure this matches the dynamic segment in your route
    const navigate = useNavigate();
    const [restaurantInfo, setRestaurantInfo] = useState({
        name: 'Loading...', // Default loading state
        address: 'Loading...',
        overallScore: 'Loading...',
        inspectionScore: 'Loading...',
        securityScore: 'Loading...'
    });

    useEffect(() => {
        // Fetch the restaurant data from the API
        fetch(`/api/restaurants/${restaurant_id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setRestaurantInfo({
                    name: data.name,
                    address: data.address,
                    overallScore: data.overallScore,
                    inspectionScore: data.inspectionScore,
                    securityScore: data.securityScore
                });
            })
    }, [restaurant_id, navigate]);

    return (
        <Container>
            <Box sx={{ my: 4, p: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
                <Typography variant="h4">{restaurantInfo.name}</Typography>
                <Typography>{restaurantInfo.address}</Typography>
                <Typography>Overall Restaurant Score: {restaurantInfo.overallScore}</Typography>
                <Typography>Inspection Score: {restaurantInfo.inspectionScore}</Typography>
                <Typography>Security Score: {restaurantInfo.securityScore}</Typography>
                <Link to={`/securityreport/${restaurant_id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="primary" sx={{ my: 1 }}>
                        Check Security Report
                    </Button>
                </Link>
                <Link to={`/inspectionreport/${restaurant_id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="primary" sx={{ my: 1 }}>
                        Check Inspection Report
                    </Button>
                </Link>
                <Link to="/nearbyrestaurant" style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="secondary" sx={{ my: 1 }}>
                        Check Nearby Better Restaurant
                    </Button>
                </Link>
            </Box>
        </Container>
    );
}
