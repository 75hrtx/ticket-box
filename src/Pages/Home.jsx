import React, { useEffect, useState, useRef } from "react";
import { Play, Ticket, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const YT_API_KEY = import.meta.env.VITE_YT_API_KEY;
const BLOCKED_GENRES = [99, 10749];

const HomePage = () => {
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const navigate = useNavigate();

  const sliderRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const nowRes = await fetch(
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&region=IN&page=1`
      );
      const upRes = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&region=IN&page=1`
      );

      const nowData = await nowRes.json();
      const upData = await upRes.json();

      const filterMovies = (movies) =>
        (movies || []).filter(
          (movie) =>
            !movie.adult &&
            !movie.genre_ids.some((id) => BLOCKED_GENRES.includes(id))
        );

      setNowPlaying(filterMovies(nowData.results));
      setUpcoming(filterMovies(upData.results));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (!nowPlaying.length) return;
    const interval = setInterval(() => {
      if (!trailerKey) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % nowPlaying.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [nowPlaying, trailerKey]);

  const handleWatchTrailer = async () => {
    const movie = nowPlaying[currentIndex];
    if (!movie) return;

    try {
      // 1️⃣ TMDB videos
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`
      );
      const data = await res.json();
      let trailer = data.results.find(
        (vid) => vid.type === "Trailer" && vid.site === "YouTube"
      );

      // 2️⃣ YouTube fallback
      if (!trailer) {
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
          trailer = video ? { key: video.id.videoId } : { key: ytData.items[0].id.videoId };
        }
      }

      if (trailer) setTrailerKey(trailer.key);
      else alert("Trailer not available.");
    } catch (err) {
      console.error(err);
      alert("Trailer not available.");
    }
  };

  const handleDrag = (diff) => {
    if (diff > 50)
      setCurrentIndex((prev) => (prev - 1 + nowPlaying.length) % nowPlaying.length);
    else if (diff < -50)
      setCurrentIndex((prev) => (prev + 1) % nowPlaying.length);
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-400">Loading movies...</p>;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="bg-green-600 rounded-b-[3rem] px-4 md:px-20 py-16 flex flex-col md:flex-row items-center justify-between w-full relative">
        <div className="max-w-xl mb-10 md:mb-0 text-center md:text-left z-10 relative">
          <h1 className="text-4xl md:text-6xl font-bold">
            Experience Movies Like Never Before
          </h1>
          <p className="mt-4 text-lg md:text-xl opacity-80">
            Book tickets, choose seats & enjoy your favorite movies.
          </p>
          <div className="mt-6 flex gap-4 justify-center md:justify-start flex-wrap">
            <Link
              to={nowPlaying[currentIndex] ? `/movies/${nowPlaying[currentIndex].id}` : "/movies"}
              className="bg-black px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-white hover:text-black transition"
            >
              <Ticket size={18} /> Book Tickets
            </Link>
            <button
              onClick={handleWatchTrailer}
              className="bg-white text-black px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-zinc-200 transition"
            >
              <Play size={18} /> Watch Trailer
            </button>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="relative w-full md:w-[68%] lg:w-[51%] aspect-[16/9] overflow-hidden flex items-center justify-center rounded-2xl shadow-lg z-0 cursor-grab"
          onMouseDown={(e) => { startX.current = e.clientX; isDragging.current = true; }}
          onMouseUp={(e) => { if(!isDragging.current) return; handleDrag(e.clientX - startX.current); isDragging.current = false; }}
          onMouseLeave={() => isDragging.current = false}
          onTouchStart={(e) => { startX.current = e.touches[0].clientX; isDragging.current = true; }}
          onTouchEnd={(e) => { if(!isDragging.current) return; handleDrag(e.changedTouches[0].clientX - startX.current); isDragging.current = false; }}
        >
          {trailerKey ? (
            <iframe
              className="w-full h-full rounded-xl"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex transition-transform duration-700 ease-in-out w-full h-full" style={{transform: `translateX(-${currentIndex*100}%)`}}>
              {nowPlaying.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-shrink-0 w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate(`/movies/${movie.id}`)}
                >
                  <img
                    src={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : "https://via.placeholder.com/500x281.png?text=No+Image"}
                    alt={movie.title}
                    className="w-full h-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Now Showing */}
      <section className="px-8 md:px-20 mt-6">
        <h2 className="text-2xl font-semibold mb-6">🎬 Now Showing</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {nowPlaying.map((movie) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}`}
              className="bg-zinc-900 rounded-xl overflow-hidden hover:scale-105 transition-transform"
            >
              <img
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "https://via.placeholder.com/200x300.png?text=No+Image"}
                alt={movie.title}
                className="w-full h-72 object-cover"
              />
              <div className="p-3">
                <h3 className="font-medium">{movie.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="px-8 md:px-20 mt-16 mb-20">
        <h2 className="text-2xl font-semibold mb-6">⏳ Coming Soon</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {upcoming.map((movie) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}`}
              className="bg-zinc-900 rounded-xl overflow-hidden hover:scale-105 transition-transform"
            >
              <img
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "https://via.placeholder.com/200x300.png?text=No+Image"}
                alt={movie.title}
                className="w-full h-72 object-cover"
              />
              <div className="p-3">
                <h3 className="font-medium">{movie.title}</h3>
                <p className="text-sm text-gray-400">Coming Soon</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
