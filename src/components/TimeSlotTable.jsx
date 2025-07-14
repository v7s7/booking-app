import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import BookingForm from './BookingForm';

import { db } from '../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function TimeSlotTable() {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

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

    console.log('✅ Events loaded from Firestore:', data); // <--- ADD THIS

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
    const response = await fetch('http://localhost:4000/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        purpose: formData.purpose,
        start: selectedSlot.start,
        end: finalEndTime,
        resource: selectedSlot.resourceId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      await fetchEventsFromFirestore(); // refresh calendar
      setSelectedSlot(null);
    } else {
      throw new Error(result?.error || result?.message || 'Unknown error from server');
    }
  } catch (err) {
    alert('❌ Failed to save booking');
    console.error(err);
  }
};

console.log('📅 Events being rendered in calendar:', events);

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
  onSubmit={() => {
    fetchEventsFromFirestore();
    setSelectedSlot(null);
  }}
/>

        )}
      </div>
    </div>
  );
}

export default TimeSlotTable;
