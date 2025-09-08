import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

export default function MyBookings() {
  const { user } = useUser();
  const [bookings, setBookings] = useState([]);

  // Fetch bookings from backend
  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:3000/api/bookings?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings || []))
      .catch((err) => console.error(err));
  }, [user]);

  // Cancel booking
  const handleCancel = async (id) => {
    const confirm = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:3000/api/bookings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel booking");

      // Remove cancelled booking from state
      setBookings((prev) => prev.filter((b) => b._id !== id));
      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error(err);
      alert("Error cancelling booking. Try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-8 py-10 pt-[8%]">
      <h2 className="text-lg font-semibold mb-6">My Bookings</h2>

      <div className="space-y-6 max-w-4xl">
        {bookings.length === 0 && (
          <p className="text-gray-400">No bookings found.</p>
        )}

        {bookings.map((booking) => (
          <div
            key={booking._id}
            className="flex bg-gradient-to-r from-[#3f1c27] to-[#260c15] rounded-md p-4 items-center"
          >
            <img
              src={booking.image || "/placeholder.jpg"}
              alt={booking.title}
              className="w-32 h-20 rounded-md object-cover"
            />
            <div className="flex-1 ml-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white">{booking.title}</h3>
                <p className="text-gray-400 text-sm mt-2">
                  {booking.date} • {booking.time}
                </p>
              </div>
              <div className="mt-2 text-gray-400 text-sm">
                <p>
                  Total Tickets: <b>{booking.totalSeats}</b>
                </p>
                <p>Seats: {booking.seats.join(", ")}</p>
              </div>
            </div>
            <div className="flex flex-col items-end ml-4">
              <div className="text-white font-bold text-xl mb-2">
                ₹{booking.totalPrice}
              </div>
              <button
                onClick={() => handleCancel(booking._id)}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
