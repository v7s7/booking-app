import React, { useState } from 'react';
import BookingForm from './BookingForm';

const initialSlots = [
  { time: '09:00 - 10:00', booked: false },
  { time: '10:00 - 11:00', booked: true },
  { time: '11:00 - 12:00', booked: false },
  { time: '12:00 - 13:00', booked: true },
  { time: '13:00 - 14:00', booked: false },
];

function TimeSlotTable() {
  const [slots, setSlots] = useState(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleBookClick = (index) => {
    setSelectedSlot(index);
  };

  const handleCloseForm = () => {
    setSelectedSlot(null);
  };

  const handleFormSubmit = (formData) => {
    const updated = [...slots];
    updated[selectedSlot].booked = true;
    console.log('Booking Info:', {
      time: updated[selectedSlot].time,
      ...formData,
    });
    setSlots(updated);
    setSelectedSlot(null);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Meeting Room Schedule</h2>
      <table className="w-full text-left border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Time</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, i) => (
            <tr key={i} className={slot.booked ? 'bg-red-100' : 'bg-green-100'}>
              <td className="p-2 border">{slot.time}</td>
              <td className="p-2 border">{slot.booked ? 'Booked' : 'Free'}</td>
              <td className="p-2 border">
                {!slot.booked ? (
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                    onClick={() => handleBookClick(i)}
                  >
                    Book
                  </button>
                ) : (
                  <span className="text-gray-400 italic">Unavailable</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSlot !== null && (
        <BookingForm
          selectedSlot={slots[selectedSlot].time}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

export default TimeSlotTable;
