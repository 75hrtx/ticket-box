import React, { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const theme = {
  primary: "#16a34a",
  primaryDull: "#15803d",
  text: "#fff",
};

const timings = ["10:30 AM", "2:00 PM", "6:30 PM", "9:30 PM", "11:00 PM"];
const rows = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const seatsPerRow = 26;
const SEAT_PRICE = 200;

const SeatLayout = ({
  onClose,
  movieId = "default",
  releaseDate,
  movieTitle = "Untitled Movie",
  movieDuration = "2h 0m",
  movieImage = "",
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedTime, setSelectedTime] = useState(timings[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState({});

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Generate 7-day date array
  useEffect(() => {
    const today = new Date();
    const start = releaseDate ? new Date(releaseDate) : today;
    const firstDay = start > today ? start : today;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    setDates(days);
    setSelectedDate(days[0]);
  }, [releaseDate]);

  // Weighted random row
  const weightedRandomRow = () => {
    const weights = rows.map((_, idx) => idx + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) return rows[i];
      r -= weights[i];
    }
    return rows[rows.length - 1];
  };

  // Generate reserved seats dynamically
  const generateRandomSeats = (time, date) => {
    const seats = new Set();
    const now = new Date();
    const showDateTime = new Date(date);
    const [hourMin, meridian] = time.split(" ");
    let [hour, minute] = hourMin.split(":").map(Number);
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    showDateTime.setHours(hour, minute, 0, 0);

    const minutesUntilShow = (showDateTime - now) / 60000;
    let reservedPercent = 0.3;
    if (minutesUntilShow <= 30) reservedPercent = 0.9;
    else if (minutesUntilShow <= 60) reservedPercent = 0.7;
    else if (minutesUntilShow <= 180) reservedPercent = 0.5;

    const reservedCount = Math.min(
      seatsPerRow * rows.length,
      Math.floor(seatsPerRow * rows.length * reservedPercent)
    );

    while (seats.size < reservedCount) {
      const row = weightedRandomRow();
      const seatNum = Math.random() > 0.5
        ? Math.floor(Math.random() * 13) + 1
        : Math.floor(Math.random() * 13) + 14;
      const seatId = `${row}${seatNum}`;
      if (Math.random() > 0.65) {
        seats.add(seatId);
        if (seatNum + 1 <= seatsPerRow) seats.add(`${row}${seatNum + 1}`);
        if (Math.random() > 0.5 && seatNum - 1 > 0) seats.add(`${row}${seatNum - 1}`);
      } else {
        seats.add(seatId);
      }
    }
    return Array.from(seats);
  };

  // Load reserved seats
  useEffect(() => {
    if (!selectedDate) return;
    const key = `reservedSeats-${movieId}-${selectedDate}-${selectedTime}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      setReservedSeats((prev) => ({
        ...prev,
        [`${selectedDate}-${selectedTime}`]: JSON.parse(stored),
      }));
    } else {
      const generated = generateRandomSeats(selectedTime, selectedDate);
      setReservedSeats((prev) => ({
        ...prev,
        [`${selectedDate}-${selectedTime}`]: generated,
      }));
      localStorage.setItem(key, JSON.stringify(generated));
    }
  }, [movieId, selectedDate, selectedTime]);

  const toggleSeat = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const currentReserved = reservedSeats[`${selectedDate}-${selectedTime}`] || [];

  const getAvailableTimings = (date) => {
    const now = new Date();
    const selected = new Date(date);

    return timings.filter((timeStr) => {
      if (
        selected.getFullYear() === now.getFullYear() &&
        selected.getMonth() === now.getMonth() &&
        selected.getDate() === now.getDate()
      ) {
        const [hourMin, meridian] = timeStr.split(" ");
        let [hour, minute] = hourMin.split(":").map(Number);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        const showTime = new Date();
        showTime.setHours(hour, minute, 0, 0);
        return showTime > now;
      }
      return true;
    });
  };

  // 🔹 Booking function: try backend, fallback to localStorage
const handleBooking = async () => {
  if (!user) return openSignIn();

  const bookingData = {
    userId: user.id,
    movieId,
    title: movieTitle,
    duration: movieDuration || "N/A",
    image: movieImage,
    date: selectedDate,
    time: selectedTime,
    seats: selectedSeats,
    totalSeats: selectedSeats.length,
    totalPrice: selectedSeats.length * SEAT_PRICE,
  };

  try {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    if (!res.ok) throw new Error("Booking failed");
    const result = await res.json();
    console.log("Booking successful (backend):", result);

    navigate("/my-bookings");
  } catch (err) {
    console.error("Backend booking failed, saving locally:", err);

    // 🔹 Save to localStorage instead
    const stored = JSON.parse(localStorage.getItem("bookings")) || [];
    stored.push(bookingData);
    localStorage.setItem("bookings", JSON.stringify(stored));

    console.log("Booking saved locally:", bookingData);
    navigate("/my-bookings");
  }
};

  const SeatBlock = ({ row, startIndex }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 28px)", gap: "8px 6px" }}>
      {Array.from({ length: 13 }, (_, i) => {
        const seatId = `${row}${i + startIndex}`;
        const isSelected = selectedSeats.includes(seatId);
        const isReserved = currentReserved.includes(seatId);
        return (
          <div
            key={seatId}
            onClick={() => !isReserved && toggleSeat(seatId)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1.5px solid ${theme.primaryDull}`,
              backgroundColor: isReserved
                ? theme.primaryDull
                : isSelected
                ? theme.primary
                : "transparent",
              cursor: isReserved ? "not-allowed" : "pointer",
            }}
          />
        );
      })}
    </div>
  );

  const dateButtonStyle = (d) => ({
    padding: "10px 16px",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: selectedDate === d ? theme.primary : "transparent",
    border: `1px solid ${theme.primary}`,
    fontWeight: 600,
    whiteSpace: "nowrap",
    color: selectedDate === d ? "#fff" : theme.text,
    lineHeight: "20px",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #102a12, #061803)",
          color: "white",
          borderRadius: 10,
          maxWidth: 1000,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 20,
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute",
          top: 15,
          right: 15,
          background: "transparent",
          border: "none",
          fontSize: 24,
          color: "white",
          cursor: "pointer",
        }}>&times;</button>

        {/* Dates */}
        <div style={{ display: "flex", gap: 12, marginBottom: 10, overflowX: "auto", paddingBottom: 40, marginTop: "3%" }}>
          {dates.map((d) => {
            const label = new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            return <div key={d} onClick={() => { setSelectedDate(d); setSelectedSeats([]); const futureTimes = getAvailableTimings(d); if(futureTimes.length>0) setSelectedTime(futureTimes[0]); }} style={dateButtonStyle(d)}>{label}</div>
          })}
        </div>

        {/* Timings */}
        <div style={{ backgroundColor: "rgba(21, 128, 61, 0.2)", borderRadius: 10, padding: 20, minWidth: 120, fontWeight: 600, fontSize: 14, marginBottom: 20, alignSelf: "flex-start", marginTop: "8%" }}>
          <div style={{ marginBottom: 12, color: theme.primary, fontWeight: "bold" }}>Available Timings</div>
          {getAvailableTimings(selectedDate).map((time) => (
            <div key={time} onClick={() => { setSelectedTime(time); setSelectedSeats([]); }} style={{
              marginBottom: 10,
              cursor: "pointer",
              fontWeight: selectedTime === time ? "bold" : "normal",
              color: selectedTime === time ? "white" : "rgba(255,255,255,0.7)",
              backgroundColor: selectedTime === time ? theme.primary : "transparent",
              borderRadius: 6,
              padding: "6px 10px",
            }}>{time}</div>
          ))}
        </div>

        {/* Screen */}
        <div style={{ position: "relative", width: "80%", height: 40, marginBottom: 100, marginTop: "10%" }}>
          <div style={{ width: "100%", height: 10, borderTopLeftRadius: "50% 40px", borderTopRightRadius: "50% 40px", backgroundColor: theme.primary, position: "absolute", bottom: 0 }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "white", fontWeight: "600", letterSpacing: 1.2 }}>SCREEN SIDE</div>
        </div>

        {/* Seats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row) => (
            <div key={row} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 20, textAlign: "right", marginRight: 8, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{row}</div>
              <div style={{ display: "flex", gap: 20 }}>
                <SeatBlock row={row} startIndex={1} />
                <SeatBlock row={row} startIndex={14} />
              </div>
            </div>
          ))}
        </div>

        {/* Seat numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "20px repeat(26, 28px)", gap: "8px 6px", justifyContent: "center", marginTop: 4, color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>
          <div />
          {Array.from({ length: 26 }, (_, i) => <div key={i} style={{ textAlign: "center" }}>{i + 1}</div>)}
        </div>

        {/* Proceed */}
        <button disabled={selectedSeats.length === 0} style={{
          marginTop: 30,
          backgroundColor: selectedSeats.length > 0 ? theme.primary : "rgba(21,128,61,0.5)",
          border: "none",
          borderRadius: 20,
          color: "white",
          padding: "12px 30px",
          fontWeight: "600",
          cursor: selectedSeats.length > 0 ? "pointer" : "not-allowed",
        }} onClick={handleBooking}>
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
};

export default SeatLayout;
