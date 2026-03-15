import { useState } from "react";
import { register } from "../api/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,500;1,400&display=swap');

  :root {
    --mint: #4ECBA6;
    --mint-light: #E8F8F3;
    --navy: #1A2E3B;
    --gray: #6B7A85;
    --gray-light: #F4F7F9;
    --white: #FFFFFF;
    --radius: 16px;
    --shadow: 0 4px 32px rgba(30,60,80,0.08);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .sc-page {
    min-height: 100vh;
    background: var(--gray-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .sc-bg-circle {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  .sc-bg-circle.one {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(78,203,166,0.11) 0%, transparent 70%);
    top: -150px; left: -100px;
  }

  .sc-bg-circle.two {
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(78,203,166,0.08) 0%, transparent 70%);
    bottom: -80px; right: -60px;
  }

  .sc-card {
    background: var(--white);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    width: 100%;
    max-width: 420px;
    padding: 44px 40px;
    position: relative;
    z-index: 1;
    animation: rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sc-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 36px;
  }

  .sc-brand-icon {
    width: 38px; height: 38px;
    background: var(--mint-light);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }

  .sc-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 500;
    color: var(--navy);
  }

  .sc-brand-name span { color: var(--mint); }

  .sc-heading {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 500;
    color: var(--navy);
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .sc-heading em { font-style: italic; color: var(--mint); }

  .sc-sub {
    font-size: 13px;
    color: var(--gray);
    margin-bottom: 28px;
  }

  .sc-sub a {
    color: var(--mint);
    text-decoration: none;
    font-weight: 700;
  }

  /* Progress bar */
  .sc-progress {
    display: flex;
    gap: 5px;
    margin-bottom: 28px;
  }

  .sc-progress-bar {
    height: 3px;
    border-radius: 2px;
    flex: 1;
    background: #E8EDEF;
    transition: background 0.3s;
  }

  .sc-progress-bar.filled { background: var(--mint); }

  .sc-field {
    margin-bottom: 14px;
  }

  .sc-field label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 6px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .sc-field input {
    width: 100%;
    padding: 13px 16px;
    border: 1.5px solid #E5EAED;
    border-radius: 10px;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    color: var(--navy);
    background: var(--gray-light);
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  .sc-field input::placeholder { color: #B8C4CA; }

  .sc-field input:focus {
    border-color: var(--mint);
    background: var(--white);
    box-shadow: 0 0 0 4px rgba(78,203,166,0.1);
  }

  .sc-btn {
    width: 100%;
    padding: 14px;
    margin-top: 8px;
    background: var(--mint);
    color: var(--white);
    border: none;
    border-radius: 10px;
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(78,203,166,0.32);
  }

  .sc-btn:hover {
    background: #3ab893;
    box-shadow: 0 6px 24px rgba(78,203,166,0.42);
    transform: translateY(-1px);
  }

  .sc-btn:active { transform: translateY(0); box-shadow: none; }

  .sc-error {
    margin-top: 14px;
    padding: 11px 14px;
    background: #FFF0EE;
    border-radius: 8px;
    color: #D95A4A;
    font-size: 13px;
    font-weight: 600;
    border-left: 3px solid #D95A4A;
  }

  .sc-terms {
    margin-top: 18px;
    font-size: 11px;
    color: #B8C4CA;
    text-align: center;
    line-height: 1.6;
    font-weight: 600;
  }

  .sc-terms a { color: #8ABFB0; text-decoration: none; }
`;

export default function Register({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const filled = [email, username, password].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const user = await register(email, username, password);
      console.log("Registered user:", user);
      onRegister(user); // call parent handler to set user state
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="sc-page">
        <div className="sc-bg-circle one" />
        <div className="sc-bg-circle two" />
        <div className="sc-card">
          <div className="sc-brand">
            <div className="sc-brand-icon">🦷</div>
            <span className="sc-brand-name">Smile<span>Care</span></span>
          </div>

          <div className="sc-progress">
            {[0, 1, 2].map(i => (
              <div key={i} className={`sc-progress-bar${i < filled ? " filled" : ""}`} />
            ))}
          </div>

          <h1 className="sc-heading">Your <em>smile</em> starts here</h1>
          <p className="sc-sub">
            Already registered? <a onClick={() => onSwitchToLogin?.()} style={{cursor: 'pointer'}}>Sign in</a>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="sc-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="sc-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="sc-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="sc-btn">Create Account →</button>
          </form>

          {error && <div className="sc-error">{error}</div>}

          <p className="sc-terms">
            By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  );
}
