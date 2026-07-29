import React, { useEffect, useState } from 'react';
import logo from '../logo.png';

const STORAGE_KEY = 'mrapex_launch_seen_v1';
const LAUNCH_WINDOW_HOURS = 48; // animation only plays within this window after go-live

export function isWithinLaunchWindow(launchedAtIso) {
  if (!launchedAtIso) return false;
  const launchedAt = new Date(launchedAtIso).getTime();
  if (Number.isNaN(launchedAt)) return false;
  const hoursSince = (Date.now() - launchedAt) / (1000 * 60 * 60);
  return hoursSince >= 0 && hoursSince <= LAUNCH_WINDOW_HOURS;
}

export function shouldShowLaunch(launchedAtIso) {
  if (!isWithinLaunchWindow(launchedAtIso)) return false;
  try {
    // The seen-flag stores WHICH launch timestamp was last seen. If the
    // admin does a test go-live and later a real go-live, the timestamp
    // changes, so the animation plays again even in a browser that saw
    // the earlier test.
    return localStorage.getItem(STORAGE_KEY) !== launchedAtIso;
  } catch {
    return false;
  }
}

function markLaunchSeen(launchedAtIso) {
  try {
    localStorage.setItem(STORAGE_KEY, launchedAtIso || 'true');
  } catch {
    /* ignore */
  }
}

export default function LaunchAnimation({ onDone, launchedAtIso }) {
  const [phase, setPhase] = useState('in'); // in -> hold -> out
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 700);
    const t2 = setTimeout(() => setPhase('out'), 3600);
    const t3 = setTimeout(() => finish(), 4300);

    const progressTimer = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 2));
    }, 60);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(progressTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    markLaunchSeen(launchedAtIso);
    onDone?.();
  };

  const sparks = Array.from({ length: 24 });

  return (
    <div
      className={`launch-root ${phase === 'out' ? 'launch-fade-out' : ''}`}
      onClick={finish}
      role="presentation"
    >
      <div className="launch-sparks">
        {sparks.map((_, i) => (
          <span
            key={i}
            className="spark"
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 12) * 0.22}s`,
              animationDuration: `${2.4 + (i % 5) * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="launch-content">
        <img src={logo} alt="MR Apex Industrial Components" className="launch-logo" />

        <h1 className="launch-title">
          MR APEX <span>INDUSTRIAL COMPONENTS</span>
        </h1>

        <p className="launch-tagline">Sourced Right. Delivered Right.</p>

        <div className="launch-live-badge">
          <span className="dot" />
          NOW LIVE
        </div>

        <div className="launch-progress-track">
          <div className="launch-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <button type="button" className="launch-skip" onClick={finish}>
          Enter Site &rarr;
        </button>
      </div>

      <style>{`
        .launch-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: radial-gradient(circle at 50% 30%, #123B63 0%, #0A1F38 55%, #061225 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          transition: opacity 0.7s ease;
          opacity: 1;
        }
        .launch-fade-out {
          opacity: 0;
          pointer-events: none;
        }
        .launch-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 24px;
          animation: launchRise 0.9s ease both;
        }
        @keyframes launchRise {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .launch-logo {
          height: 64px;
          width: auto;
          margin: 0 auto 18px;
          filter: drop-shadow(0 0 18px rgba(255,255,255,0.25));
          animation: launchPulse 2.4s ease-in-out infinite;
        }
        @keyframes launchPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .launch-title {
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: clamp(20px, 4vw, 34px);
          letter-spacing: 1px;
          margin: 0 0 6px;
        }
        .launch-title span {
          display: block;
          font-size: 0.5em;
          font-weight: 600;
          color: #9FC1E0;
          letter-spacing: 3px;
          margin-top: 4px;
        }
        .launch-tagline {
          color: #C9D9E8;
          font-size: 14px;
          letter-spacing: 0.5px;
          margin: 10px 0 22px;
          font-style: italic;
        }
        .launch-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(163, 58, 58, 0.15);
          border: 1px solid #A33A3A;
          color: #FF8A8A;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 2px;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 26px;
        }
        .launch-live-badge .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FF5555;
          animation: launchBlink 1s ease-in-out infinite;
        }
        @keyframes launchBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        .launch-progress-track {
          width: 220px;
          max-width: 60vw;
          height: 3px;
          background: rgba(255,255,255,0.15);
          border-radius: 3px;
          margin: 0 auto 22px;
          overflow: hidden;
        }
        .launch-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4A90D9, #9FC1E0);
          transition: width 0.1s linear;
        }
        .launch-skip {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.4);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .launch-skip:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .launch-sparks {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }
        .spark {
          position: absolute;
          bottom: -10px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #9FC1E0;
          opacity: 0;
          animation-name: sparkRise;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }
        @keyframes sparkRise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
