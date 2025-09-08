import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BLOCKED_GENRES = [99, 10749];

const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const languageMap = {
  en: "English",
  hi: "Hindi",
  ml: "Malayalam",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  mr: "Marathi",
  bn: "Bengali",
};

const MovieListPage = () => {
  const location = useLocation();

  const [movies, setMovies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [genreFilter, setGenreFilter] = useState([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [langFilter, setLangFilter] = useState("all");

  // Available filter options
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Show/hide filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Category state: latest, trending, top_rated
  const getCategoryFromSearch = (search) => {
    const p = new URLSearchParams(search);
    return p.get("category") || "latest";
  };
  const [category, setCategory] = useState(getCategoryFromSearch(location.search));

  useEffect(() => {
    setCategory(getCategoryFromSearch(location.search));
    setPage(1); // reset to first page when category changes
  }, [location.search]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let endpoint = "now_playing";
        if (category === "trending") endpoint = "popular";
        if (category === "top_rated") endpoint = "top_rated";

        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_API_KEY}&region=IN&page=${page}`
        );
        const data = await res.json();

        if (data.results) {
          const filteredMovies = data.results.filter(
            (movie) =>
              !movie.adult &&
              !movie.genre_ids.some((id) => BLOCKED_GENRES.includes(id))
          );

          setMovies(filteredMovies);
          setTotalPages(data.total_pages || 1);

          // Collect filter options
          const genresSet = new Set();
          const yearsSet = new Set();
          const langsSet = new Set();

          filteredMovies.forEach((movie) => {
            (movie.genre_ids || []).forEach((g) => genresSet.add(g));
            if (movie.release_date) {
              yearsSet.add(movie.release_date.slice(0, 4));
            }
            if (movie.original_language) {
              langsSet.add(movie.original_language);
            }
          });

          setAvailableGenres(
            Array.from(genresSet)
              .filter((g) => genreMap[g])
              .sort((a, b) => genreMap[a].localeCompare(genreMap[b]))
          );
          setAvailableYears(
            Array.from(yearsSet)
              .map(Number)
              .sort((a, b) => b - a)
          );
          setAvailableLanguages(
            Array.from(langsSet)
              .filter((l) => languageMap[l])
              .sort((a, b) => languageMap[a].localeCompare(languageMap[b]))
          );
        }
      } catch (err) {
        console.error("Error fetching movies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [category, page]);

  useEffect(() => {
    let temp = [...movies];

    if (genreFilter.length > 0) {
      temp = temp.filter((m) =>
        genreFilter.every((genreId) => (m.genre_ids || []).includes(genreId))
      );
    }
    if (yearFrom) {
      temp = temp.filter(
        (m) =>
          m.release_date && Number(m.release_date.slice(0, 4)) >= Number(yearFrom)
      );
    }
    if (yearTo) {
      temp = temp.filter(
        (m) =>
          m.release_date && Number(m.release_date.slice(0, 4)) <= Number(yearTo)
      );
    }
    if (langFilter !== "all") {
      temp = temp.filter((m) => m.original_language === langFilter);
    }

    // Sort based on category
    if (category === "latest") {
      temp.sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return new Date(b.release_date) - new Date(a.release_date);
      });
    } else if (category === "top_rated") {
      temp.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (category === "trending") {
      temp.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    setFiltered(temp);
  }, [movies, genreFilter, yearFrom, yearTo, langFilter, category]);

  const toggleGenre = (genreId) => {
    setGenreFilter((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setGenreFilter([]);
    setYearFrom("");
    setYearTo("");
    setLangFilter("all");
  };

  const renderStars = (vote) => {
    if (!vote && vote !== 0) return "No Rating";
    const stars = Math.round(vote / 2);
    return (
      <>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            style={{ color: i < stars ? "#FFD700" : "#555" }}
          >
            {i < stars ? "★" : "☆"}
          </span>
        ))}
      </>
    );
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-400">Loading movies...</p>;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-16 py-8 pt-24 relative">
      {/* Header Controls */}
      <div className="flex flex-wrap justify-between items-center mb-8">
        <div className="flex gap-4">
          {[
            { label: "Latest", key: "latest" },
            { label: "Trending", key: "trending" },
            { label: "Top-Rated", key: "top_rated" },
          ].map(({ label, key }) => (
            <Link
              key={key}
              to={`/movies?category=${key}`}
              className="px-4 py-2 rounded-full transition"
              style={{
                backgroundColor:
                  category === key ? "var(--color-primary)" : "transparent",
                color: category === key ? "white" : "var(--color-primary)",
                border: `2px solid var(--color-primary)`,
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setShowFilterModal(true)}
          className="font-semibold flex items-center gap-1 transition"
          style={{ color: "var(--color-primary)" }}
        >
          Filter <span>🔍</span>
        </button>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {filtered.length === 0 && (
          <p className="text-gray-400 col-span-full text-center">
            No movies found for selected filters.
          </p>
        )}
        {filtered.map((movie) => (
          <Link
            key={movie.id}
            to={`/movies/${movie.id}`}
            className="bg-zinc-900 rounded-xl overflow-hidden hover:scale-105 transition-transform"
          >
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "https://via.placeholder.com/200x300.png?text=No+Image"
              }
              alt={movie.title}
              className="w-full h-72 object-cover"
            />
            <div className="p-3">
              <h3 className="font-medium">{movie.title}</h3>
              <p className="text-sm text-gray-400">
                {movie.release_date
                  ? new Date(movie.release_date).getFullYear()
                  : "N/A"}{" "}
                • {renderStars(movie.vote_average)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between w-full max-w-80 mx-auto text-gray-500 font-medium mt-10">
          <button
            aria-label="prev"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="rounded-full bg-slate-200/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M22.499 12.85a.9.9 0 0 1 .57.205l.067.06a.9.9 0 0 1 .06 1.206l-.06.066-5.585 5.586-.028.027.028.027 5.585 5.587a.9.9 0 0 1 .06 1.207l-.06.066a.9.9 0 0 1-1.207.06l-.066-.06-6.25-6.25a1 1 0 0 1-.158-.212l-.038-.08a.9.9 0 0 1-.03-.606l.03-.083a1 1 0 0 1 .137-.226l.06-.066 6.25-6.25a.9.9 0 0 1 .635-.263Z"
                fill="#475569"
                stroke="#475569"
                strokeWidth=".078"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 text-sm font-medium">
  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const startPage = Math.max(1, page - 2);
    const pageNumber = startPage + i;
    if (pageNumber > totalPages) return null;
    return (
      <button
        key={pageNumber}
        onClick={() => setPage(pageNumber)}
        className={`h-10 w-10 flex items-center justify-center aspect-square rounded-full transition ${
          pageNumber === page
            ? "bg-[var(--color-primary)] text-white font-bold"
            : "text-gray-300 hover:bg-gray-700"
        }`}
      >
        {pageNumber}
      </button>
    );
  })}
</div>


          <button
            aria-label="next"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="rounded-full bg-slate-200/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="rotate-180"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M22.499 12.85a.9.9 0 0 1 .57.205l.067.06a.9.9 0 0 1 .06 1.206l-.06.066-5.585 5.586-.028.027.028.027 5.585 5.587a.9.9 0 0 1 .06 1.207l-.06.066a.9.9 0 0 1-1.207.06l-.066-.06-6.25-6.25a1 1 0 0 1-.158-.212l-.038-.08a.9.9 0 0 1-.03-.606l.03-.083a1 1 0 0 1 .137-.226l.06-.066 6.25-6.25a.9.9 0 0 1 .635-.263Z"
                fill="#475569"
                stroke="#475569"
                strokeWidth=".078"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieListPage;
