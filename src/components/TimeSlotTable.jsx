import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import BookingForm from './BookingForm';

import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

function TimeSlotTable({ isAdmin }) {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchEventsFromFirestore = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'bookings'));
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: `${d.name} (${d.purpose})`,
          start: d.start.toDate ? d.start.toDate() : new Date(d.start),
          end: d.end.toDate ? d.end.toDate() : new Date(d.end),
          resourceId: d.resource
        };
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchEventsFromFirestore();
  }, []);

  const handleSelect = (info) => {
    if (isAdmin || !currentUser) return;

    setSelectedSlot({
      start: info.startStr,
      resourceId: info.resource.id,
      duration: 60
    });
  };

  const handleCloseForm = () => {
    setSelectedSlot(null);
  };

  const handleSubmitBooking = async (formData, finalEndTime) => {
    try {
      if (!currentUser) {
        alert("User not authenticated");
        return;
      }

      const response = await fetch('http://localhost:4000/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          purpose: formData.purpose,
          start: selectedSlot.start,
          end: finalEndTime,
          resource: selectedSlot.resourceId,
          userId: currentUser.uid
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        await fetchEventsFromFirestore();
        setSelectedSlot(null);
      } else {
        throw new Error(result?.error || result?.message || 'Unknown error from server');
      }
    } catch (err) {
      alert('❌ Failed to save booking');
      console.error(err);
    }
  };

  const handleEventDrop = async (info) => {
    if (!isAdmin) {
      info.revert();
      alert("You are not allowed to move bookings.");
      return;
    }

    try {
      const event = info.event;
      const response = await fetch('http://localhost:4000/api/update-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          start: event.start,
          end: event.end
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await fetchEventsFromFirestore();
    } catch (err) {
      console.error("❌ Failed to move event:", err);
      info.revert();
      alert("Could not move booking.");
    }
  };

  const handleEventClick = async (clickInfo) => {
    if (!isAdmin) {
      alert("You are not allowed to delete bookings.");
      return;
    }

    const confirmDelete = window.confirm(`Delete booking: ${clickInfo.event.title}?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch('http://localhost:4000/api/delete-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clickInfo.event.id
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      await fetchEventsFromFirestore();
    } catch (err) {
      console.error("❌ Failed to delete booking:", err);
      alert("Could not delete booking.");
    }
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-container">
        <FullCalendar
          plugins={[resourceTimeGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          selectable={!isAdmin}
          editable={isAdmin}
          eventStartEditable={isAdmin}
          eventDurationEditable={isAdmin}
          eventDrop={isAdmin ? handleEventDrop : null}
          eventClick={isAdmin ? handleEventClick : null}
          selectMirror={true}
          select={handleSelect}
          events={events}
          resources={[{ id: '1', title: 'Meeting Room' }]}
          aspectRatio={1.35}
          contentHeight="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          eventContent={(arg) => (
            <div>
              <b>{arg.timeText}</b>
              <i> {arg.event.title}</i>
              {isAdmin && (
                <span
                  style={{ marginLeft: '8px', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Admin controls active"
                >
                  🗑️ ✏️
                </span>
              )}
            </div>
          )}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
        />

        {selectedSlot && (
          <BookingForm
            slot={selectedSlot}
            events={events}
            onClose={handleCloseForm}
            onSubmit={handleSubmitBooking}
          />
        )}
      </div>
    </div>
  );
}

export default TimeSlotTable;
