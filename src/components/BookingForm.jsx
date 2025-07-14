import React, { useState, useEffect } from 'react';

function BookingForm({ slot, events, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', email: '', purpose: '' });
  const [duration, setDuration] = useState(60);
  const [hasConflict, setHasConflict] = useState(false);
  const [calculatedEnd, setCalculatedEnd] = useState('');

  useEffect(() => {
    if (!slot?.start) return;

    const start = new Date(slot.start);
    if (isNaN(start.getTime())) {
      console.error('Invalid start date:', slot.start);
      setCalculatedEnd('');
      return;
    }

    const end = new Date(start.getTime() + duration * 60000);
    setCalculatedEnd(end.toISOString());

    const conflict = events.some(ev => {
      if (ev.resourceId !== slot.resourceId) return false;
      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      return start < evEnd && end > evStart;
    });

    setHasConflict(conflict);
  }, [duration, slot, events]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasConflict) return;

    try {
      const response = await fetch('http://localhost:4000/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          purpose: formData.purpose,
          start: slot.start,
          end: calculatedEnd,
          resource: slot.resourceId
        })
      });

      const result = await response.json();

     if (response.ok && result.success) {
  alert('✅ Booking saved!');
  onSubmit(); // calls fetchEventsFromFirestore + close form
} else {
  const errorMsg = result?.error || result?.message || 'Unknown error';
  alert('❌ Failed to save booking: ' + errorMsg);
}

    } catch (err) {
      alert('❌ Network error.');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Book Slot</h3>
        <p>
          Start: {new Date(slot.start).toLocaleString()} <br />
          End: {calculatedEnd ? new Date(calculatedEnd).toLocaleString() : 'Invalid Date'} <br />
          Room: {slot.resourceId}
        </p>
        <label>Duration:</label>
        <select value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="purpose"
            placeholder="Purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
          />
          {hasConflict && <p style={{ color: 'red' }}>❌ Conflict: This time overlaps an existing booking.</p>}
          <div className="form-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;
