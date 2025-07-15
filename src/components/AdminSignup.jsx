import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
// import { FaLock } from 'react-icons/fa';

function AdminLogin({ onSuccess }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, 'users', uid));
      const role = userDoc.data()?.role;

      if (role === 'admin') {
        onSuccess(); // Notify parent that admin is authenticated
        setShowLogin(false);
      } else {
        setErrorMsg('You are not authorized as admin.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
    }
  };

  return (
    <div style={{ position: 'absolute', top: 10, right: 10 }}>
      <button onClick={() => setShowLogin(!showLogin)} title="Admin Login">
        {/* <FaLock /> */}
      </button>

      {showLogin && (
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h4>Admin Login</h4>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        </form>
      )}
    </div>
  );
}

export default AdminLogin;
