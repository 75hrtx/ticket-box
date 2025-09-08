import React from 'react';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import { Route, Routes, useLocation } from 'react-router-dom';

import Home from './Pages/Home';
import Movies from './Pages/Movies';
import MovDetails from './Pages/MovDetails';
import SeatLayout from './Pages/SeatLayout';
import MyBookings from './Pages/MyBookings';
import Favourite from './Pages/Favourite';
import Profile from './Pages/profile';

import { Toaster } from 'react-hot-toast';
import Checkout from './Pages/Checkout';

const App = () => {
  const pathname = useLocation().pathname;

  const isAdminRoute = pathname.startsWith('/admin');
  // matches /movies/:id but not /movies/:id/:date
  const isMovieDetails =
    /^\/movies\/[^/]+$/.test(pathname) || /^\/movie\/[^/]+$/.test(pathname);

  const hideNavAndFooter = isAdminRoute || isMovieDetails;

  return (
    <>
      <Toaster />
      {!hideNavAndFooter && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovDetails />} />
        <Route path="/movie/:id" element={<MovDetails />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/favourite" element={<Favourite />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {!hideNavAndFooter && <Footer />}
    </>
  );
};

export default App;
