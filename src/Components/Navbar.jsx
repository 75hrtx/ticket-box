import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 10);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // TMDB search function
  const searchMovies = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMovies(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchClick = () => setShowSearchResults(true);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleResultClick = (movieId) => {
    navigate(`/movie/${movieId}`);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };
  const handleSearchBlur = () =>
    setTimeout(() => setShowSearchResults(false), 200);

  // Conditional navigation handlers
  const handleTicketsClick = () => {
    if (user) {
      navigate("/my-bookings");
      setIsOpen(false);
    } else {
      openSignIn();
    }
  };

  const handleFavouriteClick = () => {
    if (user) {
      navigate("/favourite");
      setIsOpen(false);
    } else {
      openSignIn();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 z-50 w-full flex items-center justify-between 
        px-3 md:px-8 lg:px-14 py-2 transition-all duration-300
        ${showNavbar ? "translate-y-0" : "-translate-y-full"}
        ${isScrolled ? "bg-black/20 backdrop-blur-sm" : "bg-transparent"}`}
    >
      {/* Logo */}
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="logo" className="w-20 h-auto" />
      </Link>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-black/90 backdrop-blur-md flex flex-col items-start gap-6 px-6 py-20 z-50 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <XIcon
          className="absolute top-5 right-5 w-6 h-6 cursor-pointer text-white"
          onClick={() => setIsOpen(false)}
        />

        <Link
          className="text-white hover:text-gray-300"
          onClick={() => setIsOpen(false)}
          to="/"
        >
          Home
        </Link>
        <Link
          className="text-white hover:text-gray-300"
          onClick={() => setIsOpen(false)}
          to="/movies"
        >
          Movies
        </Link>
        <button
          className="text-white hover:text-gray-300 text-left w-full bg-transparent border-none cursor-pointer"
          onClick={handleTicketsClick}
        >
          Tickets
        </button>
        <button
          className="text-white hover:text-gray-300 text-left w-full bg-transparent border-none cursor-pointer"
          onClick={handleFavouriteClick}
        >
          Favourites
        </button>
      </div>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-4 md:px-4 py-1 rounded-full backdrop-blur bg-white/10 border border-gray-300/20">
        <Link to="/" className="text-white hover:text-gray-300">
          Home
        </Link>
        <Link to="/movies" className="text-white hover:text-gray-300">
          Movies
        </Link>
        <button
          className="text-white hover:text-gray-300 cursor-pointer bg-transparent border-none"
          onClick={handleTicketsClick}
        >
          Tickets
        </button>
        <button
          className="text-white hover:text-gray-300 cursor-pointer bg-transparent border-none"
          onClick={handleFavouriteClick}
        >
          Favourites
        </button>
      </div>

      {/* Search & Login */}
      <div className="flex items-center gap-4 relative">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 border border-gray-300/20">
            <SearchIcon className="w-4 h-4 cursor-pointer text-white" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={handleSearchClick}
              onBlur={handleSearchBlur}
              className="ml-2 bg-transparent border-none outline-none text-sm w-32 md:w-40 text-white placeholder-gray-300"
            />
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-gray-900/95 backdrop-blur rounded-lg shadow-lg overflow-hidden z-50">
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((movie) => (
                  <div
                    key={movie.id}
                    className="p-3 hover:bg-gray-700/50 cursor-pointer border-b border-gray-700/30 last:border-b-0"
                    onClick={() => handleResultClick(movie.id)}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium truncate text-white">
                          {movie.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-gray-900/95 backdrop-blur rounded-lg p-3 z-50">
              <p className="text-sm text-center text-white">Searching...</p>
            </div>
          )}

          {showSearchResults &&
            searchQuery.length > 1 &&
            !isSearching &&
            searchResults.length === 0 && (
              <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-gray-900/95 backdrop-blur rounded-lg p-3 z-50">
                <p className="text-sm text-center text-white">No movies found</p>
              </div>
            )}
        </div>

        {!user ? (
          <button
            onClick={openSignIn}
            className="px-2 py-0.5 sm:px-4 sm:py-1 bg-primary hover:bg-primary-dull transition rounded-full text-sm font-medium cursor-pointer text-white"
          >
            Login
          </button>
        ) : (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        )}
      </div>

      {/* Mobile Menu Icon */}
      <MenuIcon
        className="max-md:ml-2 md:hidden w-6 h-6 cursor-pointer text-white"
        onClick={() => setIsOpen(true)}
      />
    </div>
  );
};

export default Navbar;
