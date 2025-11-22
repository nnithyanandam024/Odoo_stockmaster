import React from 'react';

const StatsCard = ({ icon, value, label, color = 'purple' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
};

export default StatsCard;