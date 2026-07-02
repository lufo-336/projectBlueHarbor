import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    brand: 'BlueHarbor',
    role: 'Role', language: 'Language', day: 'Day',
    operator: 'Operator', scheduler: 'Scheduler',
    unknownRole: 'Unrecognized Role', unknownRoleDesc: 'Your role',
    unknownRoleHelp: 'Contact your administrator for permissions.',
    operatorTitle: 'Operator Dashboard', operatorWelcome: 'Manage your daily operations.',
    schedulerTitle: 'Scheduler Dashboard', schedulerWelcome: 'Plan and coordinate your schedule.',
    // Auth
    signIn: 'Sign In', signUp: 'Sign Up', logout: 'Log Out',
    email: 'Email address', password: 'Password', confirmPassword: 'Confirm password',
    fullName: 'Full name', forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
    resetPassword: 'Reset Password', backToLogin: 'Back to sign in',
    resetSent: 'Reset link sent — check your inbox.',
    loginError: 'Incorrect email or password.', registerError: 'Registration failed. Try again.',
    passwordMismatch: 'Passwords do not match.',
    loggingIn: 'Signing in…', registering: 'Creating account…',
    heroLine1: 'PORT OPERATIONS', heroLine2: 'COMMAND CENTER',
    heroSub: 'Real-time visibility across every berth, vessel, and crew.',
    tagline: 'MARITIME OPERATIONS PLATFORM',
  },
  it: {
    brand: 'BlueHarbor', role: 'Ruolo', language: 'Lingua', day: 'Giorno',
    operator: 'Operatore', scheduler: 'Pianificatore',
    unknownRole: 'Ruolo Non Riconosciuto', unknownRoleDesc: 'Il tuo ruolo',
    unknownRoleHelp: "Contatta l'amministratore per i permessi.",
    operatorTitle: 'Dashboard Operatore', operatorWelcome: 'Gestisci le operazioni giornaliere.',
    schedulerTitle: 'Dashboard Pianificatore', schedulerWelcome: 'Pianifica e coordina il programma.',
    signIn: 'Accedi', signUp: 'Registrati', logout: 'Esci',
    email: 'Indirizzo email', password: 'Password', confirmPassword: 'Conferma password',
    fullName: 'Nome completo', forgotPassword: 'Password dimenticata?',
    noAccount: 'Non hai un account?', hasAccount: 'Hai già un account?',
    resetPassword: 'Reimposta Password', backToLogin: 'Torna al login',
    resetSent: 'Link inviato — controlla la tua casella.',
    loginError: 'Email o password errati.', registerError: 'Registrazione fallita. Riprova.',
    passwordMismatch: 'Le password non coincidono.',
    loggingIn: 'Accesso in corso…', registering: 'Creazione account…',
    heroLine1: 'OPERAZIONI PORTUALI', heroLine2: 'CENTRO CONTROLLO',
    heroSub: 'Visibilità in tempo reale su ogni ormeggio, nave e equipaggio.',
    tagline: 'PIATTAFORMA OPERAZIONI MARITTIME',
  },
  es: {
    brand: 'BlueHarbor', role: 'Rol', language: 'Idioma', day: 'Día',
    operator: 'Operador', scheduler: 'Programador',
    unknownRole: 'Rol No Reconocido', unknownRoleDesc: 'Tu rol',
    unknownRoleHelp: 'Contacta al administrador para permisos.',
    operatorTitle: 'Panel del Operador', operatorWelcome: 'Gestiona tus operaciones diarias.',
    schedulerTitle: 'Panel del Programador', schedulerWelcome: 'Planifica y coordina tu horario.',
    signIn: 'Iniciar sesión', signUp: 'Registrarse', logout: 'Cerrar sesión',
    email: 'Correo electrónico', password: 'Contraseña', confirmPassword: 'Confirmar contraseña',
    fullName: 'Nombre completo', forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes cuenta?', hasAccount: '¿Ya tienes cuenta?',
    resetPassword: 'Restablecer contraseña', backToLogin: 'Volver al inicio',
    resetSent: 'Enlace enviado — revisa tu bandeja.',
    loginError: 'Email o contraseña incorrectos.', registerError: 'Registro fallido. Inténtalo de nuevo.',
    passwordMismatch: 'Las contraseñas no coinciden.',
    loggingIn: 'Iniciando sesión…', registering: 'Creando cuenta…',
    heroLine1: 'OPERACIONES PORTUALES', heroLine2: 'CENTRO DE MANDO',
    heroSub: 'Visibilidad en tiempo real de cada muelle, buque y tripulación.',
    tagline: 'PLATAFORMA DE OPERACIONES MARÍTIMAS',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang][key] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
