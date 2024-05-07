import React from 'react';
import { AppBar, Container, Toolbar, Typography, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { NavLink } from 'react-router-dom';
import { useThemeContext } from './themeContext'; 

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
  const { toggleTheme } = useThemeContext();

  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle theme"
            onClick={toggleTheme} // 使用解构得到的函数
            sx={{ mr: 2 }}
          >
            <Brightness4Icon />
          </IconButton>
          <NavText href='/' text='HOME' isMain /> 
        </Toolbar>
      </Container>
    </AppBar>
  );
}
