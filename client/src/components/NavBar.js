import React, { useState, useEffect } from 'react';
import { AppBar, Container, Toolbar, Typography, IconButton, Box, Button, Avatar } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { NavLink } from 'react-router-dom';
import { useThemeContext } from './themeContext';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';


function NavText({ href, text, isMain }) {
  return (
    <Typography
      variant={isMain ? 'h5' : 'h6'} 
      noWrap
      style={{
        marginRight: '30px', 
        fontFamily: 'monospace', 
        fontWeight: 700, 
        letterSpacing: '.3rem', 
      }}
    >
      <NavLink
        to={href} 
        style={{
          color: 'inherit', 
          textDecoration: 'none', 
        }}
      >
        {text}
      </NavLink>
    </Typography>
  );
}

export default function NavBar() {

  const [user, setUser] = useState([]);
  const [profile, setProfile] = useState([]);

  // useEffect(
  //   () => {
  //     if (user) {
  //       axios
  //         .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
  //           headers: {
  //             Authorization: `Bearer ${user.access_token}`,
  //             Accept: 'application/json'
  //           }
  //         })
  //         .then((res) => {
  //           setProfile(res.data);
  //         })
  //         .catch((err) => console.log(err));
  //     }
  //   },
  //   [user]
  // );

  useEffect(() => {
    const token = localStorage.getItem('access_token'); 
    if (token) {
      axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })
      .then(res => setProfile(res.data))
      .catch(err => console.error('Error fetching user data:', err));
    } else {
      setProfile(null); // Clear profile if no token exists
    }
  }, [user]); // Ensure this useEffect reruns whenever the user state changes
  

  const login = useGoogleLogin({
    onSuccess: (response) => {
        localStorage.setItem('access_token', response.access_token); // Store the token
        setUser({ access_token: response.access_token });
    },
    onError: (error) => console.log('Login Failed:', error)
});

useEffect(() => {
  const token = localStorage.getItem('access_token'); // Retrieve the token
  if (token) {
    setUser({ access_token: token });
  }
}, []);


  // const logOut = () => {
  //   googleLogout();
  //   setProfile(null);
  // };

  const logOut = () => {
    googleLogout(); // Perform the actual logout via Google
    localStorage.removeItem('access_token'); // Remove the access token from local storage
    setProfile(null); // Clear the profile data in your component's state
    setUser([]); // Reset the user data in your component's state
  };
  

  const { toggleTheme } = useThemeContext();

  const responseMessage = (response) => {
    console.log(response);
  };
  const errorMessage = (error) => {
    console.log(error);
  };

  return (
    // <AppBar position='static'>
    //   <Container maxWidth='xl'>
    //     <Toolbar disableGutters>
    //       <IconButton
    //         edge="start"
    //         color="inherit"
    //         aria-label="toggle theme"
    //         onClick={toggleTheme} 
    //         sx={{ mr: 2 }}
    //       >
    //         <Brightness4Icon />
    //       </IconButton>
    //       <NavText href='/' text='HOME' isMain />
    //       <div>
    //         {/* <GoogleLogin onSuccess={responseMessage} onError={errorMessage} /> */}
    //         {profile ? (
    //             <div>
    //                 <img src={profile.picture} alt="user image" />
    //                 <h3>User Logged in</h3>
    //                 {/* <p>Name: {profile.name}</p> */}
    //                 {/* <p>Email Address: {profile.email}</p> */}
    //                 {/* <br /> */}
    //                 {/* <br /> */}
    //                 <button onClick={logOut}>Log out</button>
    //             </div>
    //         ) : (
    //             <button onClick={login}>Sign in with Google 🚀 </button>
    //         )}
    //       </div>
    //     </Toolbar>
    //   </Container>
    // </AppBar>

    <AppBar position='static'>
      <Container maxWidth='xl'>
{/* <<<<<<< HEAD */}
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Theme Toggle and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="toggle theme"
              onClick={toggleTheme}
            >
              <Brightness4Icon />
            </IconButton>
            <NavText href='/' text='HOME' isMain />
          </Box>

          {/* Google Login/Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {profile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={profile.picture} alt="user image" sx={{ width: 40, height: 40 }} />
                <Typography variant="subtitle1">Welcome, {profile.name}</Typography>
                <Button variant="outlined" color="inherit" onClick={logOut}>Log out</Button>
              </Box>
            ) : (
              <Button variant="contained" color="secondary" onClick={login}>Sign in with Google 🚀</Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
