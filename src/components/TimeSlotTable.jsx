import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import BookingForm from './BookingForm';

import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';

function TimeSlotTable() {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
const [currentUser, setCurrentUser] = useState(null); 

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setCurrentUser(user); 
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;
      setIsAdmin(role === 'admin');
    } else {
      setCurrentUser(null);
      setIsAdmin(false);
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
          title: `${d.name} (${d.purpose})`,
          start: d.start.toDate ? d.start.toDate() : new Date(d.start),
          end: d.end.toDate ? d.end.toDate() : new Date(d.end),
          resourceId: d.resource
        };
      });

      console.log('✅ Events loaded from Firestore:', data);
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchEventsFromFirestore();
  }, []);

  const handleSelect = (info) => {
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
        purpose: formData.purpose,
        start: selectedSlot.start,
        end: finalEndTime,
        resource: selectedSlot.resourceId,
        userId: currentUser.uid // ✅ properly defined now
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
  try {
    const event = info.event;

    const response = await fetch('http://localhost:4000/api/update-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: event.title,
        start: event.start,
        end: event.end
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    await fetchEventsFromFirestore();
  } catch (err) {
    console.error("❌ Failed to move event:", err);
    alert("Could not update event time.");
  }
};


const handleEventClick = async (clickInfo) => {
  const confirmDelete = window.confirm(`Delete booking: ${clickInfo.event.title}?`);
  if (!confirmDelete) return;

  try {
    const response = await fetch('http://localhost:4000/api/delete-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: clickInfo.event.title
      }),
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
          selectable={true}
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
