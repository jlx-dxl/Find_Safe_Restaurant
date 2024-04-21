import {useEffect, useState} from 'react';
import {Box, Container, Button} from '@mui/material';
import {NavLink, Link} from 'react-router-dom';
import {useLocation} from 'react-router-dom';

const config = require('../config.json');
const restaurants = require('../data/restaurant.json');
export default function RestaurantInfoPage() {
    const [restaurantInfo, setRestaurantInfo] = useState({
        name: 'Restaurant Name', // Placeholder name
        address: 'Address', // Placeholder address
        overallScore: 'TODO: define overall score', // Placeholder overall score
        inspectionScore: 'X?', // Placeholder inspection score
        securityScore: 'X?', // Placeholder security score
    });


    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const restaurant_id = queryParams.get('id');

    for (let restaurant of restaurants) {
        if (parseInt(restaurant.id) === parseInt(restaurant_id)) {
            restaurantInfo.name = restaurant.name
            restaurantInfo.address = restaurant.address
            restaurantInfo.overallScore = Math.floor(Math.random() * 101)
            restaurantInfo.inspectionScore = Math.floor(Math.random() * 101)
            restaurantInfo.securityScore = Math.floor(Math.random() * 101)
        }
    }

    // Placeholder effect for fetching restaurant info
    // useEffect(() => {
    //   fetch(/* API endpoint */)
    //     .then(res => res.json())
    //     .then(resJson => setRestaurantInfo(resJson));
    // }, []);

    return (
        <Container>
            <Box sx={{my: 4, p: 2, border: '1px solid #ccc', borderRadius: '8px'}}>
                <h1>{restaurantInfo.name}</h1>
                <p>{restaurantInfo.address}</p>
                <p>Overall Restaurant Score: {restaurantInfo.overallScore}</p>
                <p>Inspection Score: {restaurantInfo.inspectionScore}</p>
                <p>Security Score: {restaurantInfo.securityScore}</p>
                <div>
                    <Link to={`/securityreport/${restaurant_id}`}>
                        <Button variant="contained" color="primary" sx={{my: 1}}>
                            Check Security Report
                        </Button>
                    </Link>
                </div>
                <div>
                    <Link to={`/inspectionreport/${restaurant_id}`}>
                        <Button variant="contained" color="primary" sx={{my: 1}}>
                            Check Inspection Report
                        </Button>
                    </Link>
                </div>
                <div>
                    <Link to={`/nearbyrestaurant`}>
                        <Button variant="contained" color="secondary" sx={{my: 1}}>
                            Check Nearby Better Restaurant
                        </Button>
                    </Link>
                </div>
            </Box>
        </Container>
    );
}