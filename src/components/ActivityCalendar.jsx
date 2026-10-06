import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage.js';

export default function ActivityCalendar() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, streak: 0, maxStreak: 0 });

  useEffect(() => {
    try {
      const data = Storage.getWorkoutHistory() || [];
      setHistory(data);
      
      // Calculate simple stats
      let currentStreak = 0;
      let maxStreak = 0;
      let today = new Date();
      today.setHours(0,0,0,0);
      
      const dates = [...new Set(data.map(d => d.date))].sort().filter(d => {
        if (!d) return false;
        const dateObj = new Date(d);
        return !isNaN(dateObj.getTime());
      });
      let tempStreak = 0;
      let lastDate = null;
      
      dates.forEach(d => {
        const dateObj = new Date(d);
        if (!lastDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((dateObj - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) tempStreak++;
          else tempStreak = 1;
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        lastDate = dateObj;
      });
      
      if (dates.length > 0) {
        const lastWorkoutDate = new Date(dates[dates.length - 1]);
        const diffDays = Math.round((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) currentStreak = tempStreak;
      }
      
      setStats({ total: data.length, streak: currentStreak, maxStreak });
    } catch(e) {}
  }, []);

  const getHeatmap = () => {
    const weeks = 12;
    const daysPerWeek = 7;
    const map = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Start from 12 weeks ago, aligned to Monday
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (today.getDay() || 7) + 1 - (weeks - 1) * 7);
    
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < daysPerWeek; d++) {
        const current = new Date(startDay);
        current.setDate(startDay.getDate() + w * 7 + d);
        
        const dateStr = current.toISOString().split('T')[0];
        const dayWorkouts = history.filter(h => h.date === dateStr);
        let intensity = 0;
        if (dayWorkouts.length === 1) intensity = 1;
        else if (dayWorkouts.length === 2) intensity = 2;
        else if (dayWorkouts.length > 2) intensity = 3;
        
        // Don't show future days
        if (current > today) intensity = -1;
        
        week.push({ date: dateStr, intensity, count: dayWorkouts.length });
      }
      map.push(week);
    }
    return map;
  };

  const heatmap = getHeatmap();

  return (
    <div className="cal-container">
      <div className="cal-stats">
        <div className="cal-stat-item">
          <span className="cal-stat-val">{stats.total}</span>
          <span className="cal-stat-label">Total Sessions</span>
        </div>
        <div className="cal-stat-item">
          <span className="cal-stat-val">{stats.streak}</span>
          <span className="cal-stat-label">Current Streak</span>
        </div>
        <div className="cal-stat-item">
          <span className="cal-stat-val">{stats.maxStreak}</span>
          <span className="cal-stat-label">Longest Streak</span>
        </div>
      </div>

      <div className="cal-heatmap-wrapper">
        <div className="cal-heatmap">
          {heatmap.map((week, wIndex) => (
            <div key={wIndex} className="cal-week">
              {week.map((day, dIndex) => (
                <div 
                  key={dIndex} 
                  className={`cal-day cal-intensity-${day.intensity === -1 ? 'none' : day.intensity}`}
                  title={day.intensity >= 0 ? `${day.count} workouts on ${day.date}` : ''}
                ></div>
              ))}
            </div>
          ))}
        </div>
        <div className="cal-legend">
          <span>Less</span>
          <div className="cal-day cal-intensity-0"></div>
          <div className="cal-day cal-intensity-1"></div>
          <div className="cal-day cal-intensity-2"></div>
          <div className="cal-day cal-intensity-3"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
