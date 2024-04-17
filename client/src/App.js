import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline } from '@mui/material';
import { ThemeProviderWrapper } from './components/themeContext';

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import RestaurantInfoPage from './pages/RestaurantInfoPage';
import NearByRestaurantPage from './pages/NearByRestaurantPage';
import SecurityReportPage from './pages/SecurityReportPage';
import InspectionReportPage from './pages/InspectionReportPage';

export default function App() {
  return (
    <ThemeProviderWrapper>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurant/:restaurant_id" element={<RestaurantInfoPage />} />
          <Route path="/securityreport/:restaurant_id" element={<SecurityReportPage />} />
          <Route path="/inspectionreport/:restaurant_id" element={<InspectionReportPage />} />
          <Route path="/nearbyrestaurant" element={<NearByRestaurantPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProviderWrapper>
  );
}
