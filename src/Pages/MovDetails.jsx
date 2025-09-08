import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clapperboard, Film, Star, Ticket, User, Menu, X } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react"; // <-- Clerk imports
import SeatLayout from "./SeatLayout";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const YT_API_KEY = import.meta.env.VITE_YT_API_KEY;

const MovDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useUser();
  const { openSignIn } = useClerk(); // <-- Clerk login

  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);

  const [showSeatLayout, setShowSeatLayout] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const data = await res.json();
        setMovie(data);
      } catch (err) {
        console.error("Error fetching movie:", err);
      }
    };

    const fetchCredits = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const data = await res.json();
        setCast((data.cast || []).slice(0, 10));
        setCrew((data.crew || []).slice(0, 10));
      } catch (err) {
        console.error("Error fetching credits:", err);
      }
    };

    fetchMovie();
    fetchCredits();
  }, [id]);

  const handleWatchTrailer = async () => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const data = await res.json();
      let trailer = (data.results || []).find(
        (vid) => vid.type === "Trailer" && vid.site === "YouTube"
      );

      if (!trailer && movie) {
        const year = new Date().getFullYear();
        const query = `${movie.title} official trailer ${year}`;
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            query
          )}&key=${YT_API_KEY}&maxResults=5&type=video`
        );
        const ytData = await ytRes.json();
        if (ytData.items && ytData.items.length > 0) {
          const video = ytData.items.find((v) =>
            v.snippet.title.toLowerCase().includes("trailer")
          );
          trailer = video
            ? { key: video.id.videoId }
            : { key: ytData.items[0].id.videoId };
        }
      }

      if (trailer) {
        setTrailerKey(trailer.key);
        setShowTrailer(true);
      } else {
        alert("Trailer not available.");
      }
    } catch (err) {
      console.error("Error fetching trailer:", err);
      alert("Trailer not available.");
    }
  };

  const handleBookNow = () => {
    setShowSeatLayout(true);
  };

  // 🔹 Handle Profile navigation
  const handleProfileClick = () => {
    if (!user) {
      openSignIn();
    } else {
      navigate("/profile");
    }
    setIsMenuOpen(false);
  };

  // 🔹 Handle Bookings navigation
  const handleBookingsClick = () => {
    if (!user) {
      openSignIn();
    } else {
      navigate("/my-bookings"); // this points to MyBookings.jsx
    }
    setIsMenuOpen(false);
  };

  if (!movie) return <div className="text-white p-8">Loading...</div>;

  // 🔹 Check if movie is released
  const isReleased = movie?.release_date
    ? new Date(movie.release_date) <= new Date()
    : true;

  return (
    <div className="flex h-screen bg-black text-white font-inter">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[#111] flex flex-col py-6 px-4 border-r border-gray-800
          transform transition-transform duration-300 z-50
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex justify-between items-center mb-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold text-green-500 px-2 hover:text-green-400"
            onClick={() => setIsMenuOpen(false)}
          >
            <Clapperboard size={28} /> Ticket Box
          </Link>
          {/* Close icon on mobile */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-4 text-gray-300 text-base">
          <Link
            to="/movies?category=latest"
            className="flex items-center gap-2 hover:text-green-400"
            onClick={() => setIsMenuOpen(false)}
          >
            <Film size={18} /> Movies
          </Link>
          <Link
            to="/movies?category=top_rated"
            className="flex items-center gap-2 hover:text-green-400"
            onClick={() => setIsMenuOpen(false)}
          >
            <Star size={18} /> Top Rated
          </Link>
          <button
            onClick={handleBookingsClick}
            className="flex items-center gap-2 hover:text-green-400 text-left"
          >
            <Ticket size={18} /> Bookings
          </button>
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 hover:text-green-400 text-left"
          >
            <User size={18} /> Profile
          </button>
        </nav>
      </aside>

      {/* Hamburger menu button (mobile only) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-green-600 p-2 rounded-lg text-white"
        onClick={() => setIsMenuOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {showTrailer && trailerKey && (
          <div className="mb-6">
            <iframe
              className="w-full h-[400px] rounded-xl"
              src={`https://www.youtube.com/embed/${trailerKey}`}
              title="Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* Rating & Trailer */}
        <div className="bg-green-600 rounded-xl h-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-lg font-bold">
              {movie.vote_average?.toFixed(1)}
            </div>
            <p className="text-lg">
              {movie.vote_count?.toLocaleString()} Votes • Users recommend it
            </p>
          </div>
          <button
            onClick={handleWatchTrailer}
            className="bg-black text-green-500 px-4 py-2 rounded-lg font-medium hover:bg-gray-900"
          >
            ▶ Watch Trailer
          </button>
        </div>

        {/* Movie Info */}
        <div className="mt-8 flex gap-6">
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            alt={movie.title}
            className="w-40 h-56 rounded-lg object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold">{movie.title}</h2>
            <p className="text-sm text-gray-400">{movie.tagline}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-300">
              <span>{movie.runtime} min</span>
              <span>{movie.adult ? "18+" : "PG-13"}</span>
              <span>{movie.genres?.map((g) => g.name).join(", ")}</span>
            </div>
            <div className="mt-3">
              <h3 className="font-medium">Synopsis</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-xl leading-relaxed">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>

        {/* Cast */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Cast</h3>
          <div className="flex overflow-x-auto gap-4">
            {cast.map((person) => (
              <div
                key={person.cast_id ?? person.credit_id}
                className="flex-shrink-0 w-24"
              >
                <img
                  src={
                    person.profile_path
                      ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                      : "https://via.placeholder.com/100x150.png?text=No+Image"
                  }
                  alt={person.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm mt-1">{person.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Crew */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Crew</h3>
          <div className="flex overflow-x-auto gap-4">
            {crew.map((person) => (
              <div key={person.credit_id} className="flex-shrink-0 w-24">
                <img
                  src={
                    person.profile_path
                      ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                      : "https://via.placeholder.com/100x150.png?text=No+Image"
                  }
                  alt={person.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm mt-1">{person.name}</p>
                <p className="text-xs text-gray-400">{person.job}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Book / Pre-Book Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleBookNow}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            {isReleased ? "Book Now" : "Pre-Book Now"}
          </button>
        </div>

        {/* SeatLayout Modal */}
        {showSeatLayout && (
          <SeatLayout
            onClose={() => setShowSeatLayout(false)}
            movieId={movie.id}
            movieTitle={movie.title}
            movieDuration={movie.runtime ? `${Math.floor(movie.runtime/60)}h ${movie.runtime % 60}m` : "N/A"}
            movieImage={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ""}
            releaseDate={movie.release_date}
          />
        )}
      </main>
    </div>
  );
};

export default MovDetails;
