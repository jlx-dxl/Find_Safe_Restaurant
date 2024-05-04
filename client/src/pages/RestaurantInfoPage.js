import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Box, Typography, Button, Grid, Card, CardContent, CardActions } from '@mui/material';

export default function RestaurantInfoPage() {
    const { restaurant_id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true); // Initially set the loading state to true
    const [restaurantInfo, setRestaurantInfo] = useState({
        name: '',
        address: '',
        overallScore: '',
        inspectionScore: '',
        securityScore: '',
    });

    useEffect(() => {
        // Fetch basic restaurant information
        fetch(`http://localhost:8080/getRestaurantInfo?resID=${restaurant_id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setRestaurantInfo(prevInfo => ({
                    ...prevInfo,
                    name: data.restaurant_name,
                    address: data.restaurant_address
                }));
            })
            .catch(error => {
                console.error('Error fetching basic info:', error);
                navigate('/error');
            });

        // Fetch the overall score and other scores
        fetch(`http://localhost:8080/getRestaurantOverallScore?resID=${restaurant_id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setRestaurantInfo(prevInfo => ({
                    ...prevInfo,
                    overallScore: data.overallScore.toFixed(2),
                    inspectionScore: data.inspectionScore.toFixed(2),
                    securityScore: data.safetyScore.toFixed(2),
                }));
                setIsLoading(false); // Set loading to false after receiving all data
            })
            .catch(error => {
                console.error('Error fetching scores:', error);
                navigate('/error');
            });

    }, [restaurant_id, navigate]);
    return (
        <Box sx={{
            backgroundImage: 'url("/restaurant-info-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh', // Adjust the height of the image as needed
            display: 'flex',
        }}>
            <Container maxWidth="md" sx={{ mt: 4 }}>
                {isLoading ? (
                    <Typography variant="h4" sx={{ textAlign: 'center' }}>Loading...</Typography>
                ) : (
                    <>
                        <Card raised sx={{ mb: 4 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    {restaurantInfo.name}
                                </Typography>
                                <Typography variant="subtitle1" gutterBottom>
                                    {restaurantInfo.address}
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    Overall Restaurant Score: {restaurantInfo.overallScore}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <ScoreCard
                                    title="Inspection Score"
                                    score={restaurantInfo.inspectionScore}
                                    link={`/inspectionreport/${restaurant_id}`}
                                    buttonText="Check Inspection Report"
                                    color="warning"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <ScoreCard
                                    title="Security Score"
                                    score={restaurantInfo.securityScore}
                                    link={`/securityreport/${restaurant_id}`}
                                    buttonText="Check Security Report"
                                    color="info"
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Link to={`/nearbyrestaurant/${restaurant_id}`} style={{ textDecoration: 'none' }}>
                                <Button variant="contained" color="success" size="large">
                                    Check Nearby Better Restaurant
                                </Button>
                            </Link>
                        </Box>
                    </>
                )}
            </Container>
        </Box>
    );
}

function ScoreCard({ title, score, link, buttonText, color }) {
    return (
        <Card raised>
            <CardContent sx={{ bgcolor: color + ".light", p: 3 }}>
                <Typography variant="h5" component="div">
                    {title}
                </Typography>
                <Typography variant="h6">
                    {score}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Link to={link} style={{ textDecoration: 'none' }}>
                    <Button size="small" variant="contained" color={color}>
                        {buttonText}
                    </Button>
                </Link>
            </CardActions>
        </Card>
    );
}
