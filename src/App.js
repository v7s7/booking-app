import React, { useState } from 'react';
import TimeSlotTable from './components/TimeSlotTable';
import AdminSignup from './components/AdminSignup';

function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin login or signup logic */}
      <AdminSignup onSuccess={() => setAdminLoggedIn(true)} />

      {/* Pass login state to TimeSlotTable */}
      <TimeSlotTable isAdmin={adminLoggedIn} />
    </div>
  );
}

export default App;
