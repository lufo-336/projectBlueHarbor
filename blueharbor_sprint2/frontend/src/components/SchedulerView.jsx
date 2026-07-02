import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const SCHEDULE = [
  { time: '08:00', route: 'Naples → Genoa', vessel: 'MSC Adriana', status: 'confirmed' },
  { time: '10:30', route: 'Genoa → Barcelona', vessel: 'MSC Valentina', status: 'pending' },
  { time: '13:00', route: 'Barcelona → Marseille', vessel: 'MSC Elisa', status: 'confirmed' },
  { time: '16:45', route: 'Marseille → Valencia', vessel: 'MSC Serena', status: 'delayed' },
  { time: '19:00', route: 'Valencia → Algeciras', vessel: 'MSC Fiamma', status: 'confirmed' },
];

const STATUS_LABELS = { confirmed: 'Confirmed', pending: 'Pending', delayed: 'Delayed' };

export default function SchedulerView({ refreshTrigger }) {
  const { t } = useLanguage();
  return (
    <section className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">{t('schedulerTitle')}</h1>
        <p className="dashboard__subtitle">{t('schedulerWelcome')}</p>
      </div>
      <div className="schedule-table-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Route</th>
              <th>Vessel</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {SCHEDULE.map((row, i) => (
              <tr key={i}>
                <td className="schedule-table__time">{row.time}</td>
                <td>{row.route}</td>
                <td className="schedule-table__vessel">{row.vessel}</td>
                <td>
                  <span className={`status-badge status-badge--${row.status}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
