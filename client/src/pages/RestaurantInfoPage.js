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
        let isInspectionScoreReceived = false;
        let isDangerScoreReceived = false;
        let tempInspectionScore = 0;
        let tempDangerScore = 0;
    
        // Fetch basic restaurant information
        fetch(`/getRestaurantInfo?resID=${restaurant_id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setRestaurantInfo(prev => ({
                    ...prev,
                    name: data.restaurant_name,
                    address: data.restaurant_address,
                }));
            })
            .catch(error => {
                console.error(error);
                navigate('/error'); // Redirect on error
            });
    
        // Fetch the inspection score
        fetch(`/getInspectionScore?resID=${restaurant_id}`)
            .then(response => response.ok ? response.json() : Promise.reject('Failed to load inspection score'))
            .then(data => {
                tempInspectionScore = data.inspectionScore;
                isInspectionScoreReceived = true;
                tryUpdateOverallScore();
            })
            .catch(error => console.error(error));
    
        // Fetch the danger score and update securityScore
        fetch(`/getDangerScore?resID=${restaurant_id}`)
            .then(response => response.ok ? response.json() : Promise.reject('Failed to load danger score'))
            .then(data => {
                tempDangerScore = data.dangerScore;
                isDangerScoreReceived = true;
                setRestaurantInfo(prev => ({
                    ...prev,
                    securityScore: tempDangerScore, // Update securityScore with the fetched dangerScore
                }));
                tryUpdateOverallScore();
            })
            .catch(error => console.error(error));
    
            function tryUpdateOverallScore() {
                if (isInspectionScoreReceived && isDangerScoreReceived) {
                    setIsLoading(false); // Set loading to false when all data is received
                    const overallScore = tempInspectionScore + tempDangerScore;
                    setRestaurantInfo(prev => ({
                        ...prev,
                        overallScore: overallScore.toFixed(2),
                        inspectionScore: tempInspectionScore.toFixed(2),
                        securityScore: tempDangerScore.toFixed(2),
                    }));
                }
            }
        }, [restaurant_id, navigate]);
    
    
        return (
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
        );
    }

function ScoreCard({ title, score, link, buttonText, color }) {
    return (
        <Card raised>
            <CardContent sx={{ bgcolor: color+".light", p: 3 }}>
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
