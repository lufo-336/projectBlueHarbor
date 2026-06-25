import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function OperatorView({ refreshTrigger }) {
  const { t } = useLanguage();
  return (
    <section className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">{t('operatorTitle')}</h1>
        <p className="dashboard__subtitle">{t('operatorWelcome')}</p>
      </div>
      <div className="dashboard__grid">
        <div className="card">
          <div className="card__icon card__icon--blue">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 14h2M14 14h2M8 17h2M14 17h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card__body">
            <span className="card__kpi">24</span>
            <span className="card__label">Active Tasks</span>
          </div>
        </div>
        <div className="card">
          <div className="card__icon card__icon--gold">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="card__body">
            <span className="card__kpi">7</span>
            <span className="card__label">Pending Shipments</span>
          </div>
        </div>
        <div className="card">
          <div className="card__icon card__icon--green">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="card__body">
            <span className="card__kpi">143</span>
            <span className="card__label">Completed Today</span>
          </div>
        </div>
        <div className="card">
          <div className="card__icon card__icon--red">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="card__body">
            <span className="card__kpi">2</span>
            <span className="card__label">Alerts</span>
          </div>
        </div>
      </div>
    </section>
  );
}
