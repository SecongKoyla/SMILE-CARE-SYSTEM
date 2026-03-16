// const css = `
//   @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,500;1,400&display=swap');
//
//   :root {
//     --mint: #4ECBA6;
//     --mint-light: #E8F8F3;
//     --mint-mid: #C2EEE0;
//     --navy: #1A2E3B;
//     --gray: #6B7A85;
//     --gray-light: #F4F7F9;
//     --white: #FFFFFF;
//     --shadow: 0 2px 20px rgba(30,60,80,0.07);
//     --shadow-hover: 0 6px 32px rgba(30,60,80,0.12);
//   }
//
//   * { box-sizing: border-box; margin: 0; padding: 0; }
//
//   .sc-app {
//     min-height: 100vh;
//     background: var(--gray-light);
//     font-family: 'Nunito', sans-serif;
//     color: var(--navy);
//   }
//
//   /* ─── NAV ─── */
//   .sc-nav {
//     background: var(--white);
//     border-bottom: 1px solid #EDF0F2;
//     padding: 0 32px;
//     height: 64px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     position: sticky;
//     top: 0;
//     z-index: 20;
//   }
//
//   .sc-brand {
//     display: flex;
//     align-items: center;
//     gap: 10px;
//     text-decoration: none;
//   }
//
//   .sc-brand-icon {
//     width: 36px; height: 36px;
//     background: var(--mint-light);
//     border-radius: 9px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 17px;
//   }
//
//   .sc-brand-name {
//     font-family: 'Playfair Display', serif;
//     font-size: 19px;
//     font-weight: 500;
//     color: var(--navy);
//   }
//
//   .sc-brand-name span { color: var(--mint); }
//
//   .sc-nav-right {
//     display: flex;
//     align-items: center;
//     gap: 12px;
//   }
//
//   .sc-avatar {
//     width: 36px; height: 36px;
//     border-radius: 50%;
//     background: var(--mint);
//     color: var(--white);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 14px;
//     font-weight: 700;
//     cursor: pointer;
//   }
//
//   .sc-nav-name {
//     font-size: 13px;
//     font-weight: 700;
//     color: var(--navy);
//   }
//
//   /* ─── MAIN ─── */
//   .sc-main {
//     max-width: 960px;
//     margin: 0 auto;
//     padding: 36px 24px 60px;
//     animation: rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
//   }
//
//   @keyframes rise {
//     from { opacity: 0; transform: translateY(16px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//
//   /* ─── HERO GREETING ─── */
//   .sc-greeting {
//     background: linear-gradient(120deg, #1A2E3B 0%, #234358 100%);
//     border-radius: 20px;
//     padding: 36px 40px;
//     margin-bottom: 28px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     overflow: hidden;
//     position: relative;
//   }
//
//   .sc-greeting::after {
//     content: '🦷';
//     position: absolute;
//     right: 160px;
//     font-size: 80px;
//     opacity: 0.06;
//     top: 50%;
//     transform: translateY(-50%) rotate(-20deg);
//   }
//
//   .sc-greeting-text h2 {
//     font-family: 'Playfair Display', serif;
//     font-size: 28px;
//     font-weight: 500;
//     color: var(--white);
//     margin-bottom: 6px;
//     line-height: 1.2;
//   }
//
//   .sc-greeting-text h2 em {
//     font-style: italic;
//     color: var(--mint);
//   }
//
//   .sc-greeting-text p {
//     font-size: 13px;
//     color: rgba(255,255,255,0.5);
//     font-weight: 400;
//   }
//
//   .sc-book-btn {
//     background: var(--mint);
//     color: var(--white);
//     border: none;
//     border-radius: 10px;
//     padding: 13px 24px;
//     font-family: 'Nunito', sans-serif;
//     font-size: 14px;
//     font-weight: 700;
//     cursor: pointer;
//     white-space: nowrap;
//     transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
//     box-shadow: 0 4px 16px rgba(78,203,166,0.35);
//     position: relative;
//     z-index: 1;
//   }
//
//   .sc-book-btn:hover {
//     background: #3ab893;
//     transform: translateY(-1px);
//     box-shadow: 0 6px 24px rgba(78,203,166,0.45);
//   }
//
//   /* ─── SECTION TITLE ─── */
//   .sc-section-title {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 0.1em;
//     text-transform: uppercase;
//     color: var(--gray);
//     margin-bottom: 14px;
//   }
//
//   /* ─── STATS ROW ─── */
//   .sc-stats {
//     display: grid;
//     grid-template-columns: repeat(3, 1fr);
//     gap: 14px;
//     margin-bottom: 28px;
//   }
//
//   .sc-stat {
//     background: var(--white);
//     border-radius: 14px;
//     padding: 22px 24px;
//     box-shadow: var(--shadow);
//     display: flex;
//     align-items: center;
//     gap: 16px;
//     transition: box-shadow 0.2s, transform 0.15s;
//   }
//
//   .sc-stat:hover {
//     box-shadow: var(--shadow-hover);
//     transform: translateY(-2px);
//   }
//
//   .sc-stat-icon {
//     width: 44px; height: 44px;
//     border-radius: 12px;
//     background: var(--mint-light);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 20px;
//     flex-shrink: 0;
//   }
//
//   .sc-stat-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 0.05em;
//     text-transform: uppercase;
//     color: var(--gray);
//     margin-bottom: 4px;
//   }
//
//   .sc-stat-value {
//     font-family: 'Playfair Display', serif;
//     font-size: 24px;
//     font-weight: 500;
//     color: var(--navy);
//     line-height: 1;
//   }
//
//   /* ─── TWO-COL LAYOUT ─── */
//   .sc-cols {
//     display: grid;
//     grid-template-columns: 1fr 340px;
//     gap: 14px;
//   }
//
//   /* ─── CARD ─── */
//   .sc-card {
//     background: var(--white);
//     border-radius: 14px;
//     padding: 26px;
//     box-shadow: var(--shadow);
//   }
//
//   .sc-card-title {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 0.08em;
//     text-transform: uppercase;
//     color: var(--gray);
//     margin-bottom: 20px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//   }
//
//   .sc-card-title a {
//     color: var(--mint);
//     text-decoration: none;
//     font-size: 11px;
//     transition: opacity 0.2s;
//   }
//
//   .sc-card-title a:hover { opacity: 0.7; }
//
//   /* ─── APPOINTMENT LIST ─── */
//   .sc-appt-list {
//     display: flex;
//     flex-direction: column;
//     gap: 10px;
//   }
//
//   .sc-appt {
//     display: flex;
//     align-items: center;
//     gap: 14px;
//     padding: 14px 16px;
//     border-radius: 10px;
//     background: var(--gray-light);
//     transition: background 0.15s;
//     cursor: pointer;
//   }
//
//   .sc-appt:hover { background: var(--mint-light); }
//
//   .sc-appt-date {
//     width: 44px;
//     text-align: center;
//     flex-shrink: 0;
//   }
//
//   .sc-appt-day {
//     font-family: 'Playfair Display', serif;
//     font-size: 22px;
//     font-weight: 500;
//     color: var(--navy);
//     line-height: 1;
//   }
//
//   .sc-appt-month {
//     font-size: 10px;
//     font-weight: 700;
//     letter-spacing: 0.08em;
//     text-transform: uppercase;
//     color: var(--gray);
//   }
//
//   .sc-appt-divider {
//     width: 1px;
//     height: 36px;
//     background: #E5EAED;
//     flex-shrink: 0;
//   }
//
//   .sc-appt-info { flex: 1; min-width: 0; }
//
//   .sc-appt-type {
//     font-size: 14px;
//     font-weight: 700;
//     color: var(--navy);
//     margin-bottom: 2px;
//   }
//
//   .sc-appt-doctor {
//     font-size: 12px;
//     color: var(--gray);
//     font-weight: 400;
//   }
//
//   .sc-appt-time {
//     font-size: 12px;
//     font-weight: 700;
//     color: var(--mint);
//     white-space: nowrap;
//     background: var(--mint-light);
//     padding: 4px 10px;
//     border-radius: 20px;
//   }
//
//   .sc-appt-empty {
//     text-align: center;
//     padding: 28px 0;
//     color: var(--gray);
//     font-size: 13px;
//     font-weight: 400;
//   }
//
//   .sc-appt-empty span {
//     display: block;
//     font-size: 32px;
//     margin-bottom: 8px;
//   }
//
//   /* ─── QUICK ACTIONS ─── */
//   .sc-actions {
//     display: flex;
//     flex-direction: column;
//     gap: 8px;
//   }
//
//   .sc-action-btn {
//     display: flex;
//     align-items: center;
//     gap: 12px;
//     padding: 14px 16px;
//     background: var(--gray-light);
//     border: none;
//     border-radius: 10px;
//     cursor: pointer;
//     text-align: left;
//     transition: background 0.15s, transform 0.12s;
//     width: 100%;
//     font-family: 'Nunito', sans-serif;
//   }
//
//   .sc-action-btn:hover {
//     background: var(--mint-light);
//     transform: translateX(3px);
//   }
//
//   .sc-action-icon {
//     width: 36px; height: 36px;
//     border-radius: 9px;
//     background: var(--white);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 16px;
//     flex-shrink: 0;
//     box-shadow: 0 1px 6px rgba(30,60,80,0.06);
//   }
//
//   .sc-action-label {
//     font-size: 13px;
//     font-weight: 700;
//     color: var(--navy);
//   }
//
//   .sc-action-sub {
//     font-size: 11px;
//     color: var(--gray);
//     font-weight: 400;
//   }
//
//   .sc-action-arrow {
//     margin-left: auto;
//     color: var(--gray);
//     font-size: 14px;
//     opacity: 0.4;
//   }
//
//   /* ─── TIPS BANNER ─── */
//   .sc-tip {
//     background: var(--mint-light);
//     border-radius: 12px;
//     padding: 16px 20px;
//     margin-top: 14px;
//     display: flex;
//     align-items: center;
//     gap: 12px;
//     border-left: 3px solid var(--mint);
//   }
//
//   .sc-tip p {
//     font-size: 13px;
//     color: var(--navy);
//     font-weight: 600;
//     line-height: 1.4;
//   }
//
//   .sc-tip small {
//     display: block;
//     font-size: 11px;
//     color: var(--gray);
//     font-weight: 400;
//     margin-top: 2px;
//   }
// `;
//
// const upcomingAppointments = [
//   { day: "14", month: "Mar", type: "Teeth Cleaning", doctor: "Dr. Rivera", time: "9:00 AM" },
//   { day: "28", month: "Mar", type: "Orthodontic Check", doctor: "Dr. Santos", time: "2:30 PM" },
// ];
//
// export default function Dashboard({ user }) {
//
//   return (
//     <>
//       <style>{css}</style>
//       <div className="sc-app">
//
//         {/* Nav */}
//         <nav className="sc-nav">
//           <a href="#" className="sc-brand">
//             <div className="sc-brand-icon">🦷</div>
//             <span className="sc-brand-name">Smile<span>Care</span></span>
//           </a>
//           <div className="sc-nav-right">
//             <span className="sc-nav-name">{user?.fullName || "User"}</span>
//             <div className="sc-avatar">J</div>
//           </div>
//         </nav>
//
//         <main className="sc-main">
//
//           {/* Greeting hero */}
//           <div className="sc-greeting">
//             <div className="sc-greeting-text">
//               <h2>Good morning, <em>Jane!</em></h2>
//               <p>You have 2 upcoming appointments this month.</p>
//             </div>
//             <button className="sc-book-btn">+ Book Appointment</button>
//           </div>
//
//           {/* Stats */}
//           <div className="sc-stats">
//             {[
//               { icon: "📅", label: "Next Visit", value: "Mar 14" },
//               { icon: "✅", label: "Visits This Year", value: "3" },
//               { icon: "🌟", label: "Smile Score", value: "98%" },
//             ].map(s => (
//               <div key={s.label} className="sc-stat">
//                 <div className="sc-stat-icon">{s.icon}</div>
//                 <div>
//                   <div className="sc-stat-label">{s.label}</div>
//                   <div className="sc-stat-value">{s.value}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//
//           {/* Two-col */}
//           <div className="sc-cols">
//
//             {/* Appointments */}
//             <div className="sc-card">
//               <div className="sc-card-title">
//                 <span>Upcoming Appointments</span>
//                 <a href="#">View all →</a>
//               </div>
//               <div className="sc-appt-list">
//                 {upcomingAppointments.length === 0 ? (
//                   <div className="sc-appt-empty">
//                     <span>📋</span>
//                     No upcoming appointments.<br />Book one to get started!
//                   </div>
//                 ) : upcomingAppointments.map((a, i) => (
//                   <div key={i} className="sc-appt">
//                     <div className="sc-appt-date">
//                       <div className="sc-appt-day">{a.day}</div>
//                       <div className="sc-appt-month">{a.month}</div>
//                     </div>
//                     <div className="sc-appt-divider" />
//                     <div className="sc-appt-info">
//                       <div className="sc-appt-type">{a.type}</div>
//                       <div className="sc-appt-doctor">{a.doctor}</div>
//                     </div>
//                     <div className="sc-appt-time">{a.time}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//
//             {/* Quick actions + tip */}
//             <div>
//               <div className="sc-card">
//                 <div className="sc-card-title"><span>Quick Actions</span></div>
//                 <div className="sc-actions">
//                   {[
//                     { icon: "📅", label: "Book Appointment", sub: "Schedule a new visit" },
//                     { icon: "📋", label: "My Records", sub: "View dental history" },
//                     { icon: "💊", label: "Prescriptions", sub: "Current medications" },
//                     { icon: "💬", label: "Message Doctor", sub: "Send a quick note" },
//                   ].map(a => (
//                     <button key={a.label} className="sc-action-btn">
//                       <div className="sc-action-icon">{a.icon}</div>
//                       <div>
//                         <div className="sc-action-label">{a.label}</div>
//                         <div className="sc-action-sub">{a.sub}</div>
//                       </div>
//                       <span className="sc-action-arrow">›</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//
//               <div className="sc-tip">
//                 <span style={{fontSize: 22}}>💡</span>
//                 <p>
//                   Brush for 2 minutes, twice a day.
//                   <small>Your next cleaning is in 9 days.</small>
//                 </p>
//               </div>
//             </div>
//
//           </div>
//         </main>
//       </div>
//     </>
//   );
// }
