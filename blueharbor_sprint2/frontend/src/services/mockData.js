// frontend/src/services/mockData.js

// Dati finti per testare il frontend
export const mockData = {
  // Dashboard Scheduler
  schedulerDashboard: {
    currentDay: 1,
    pendingShips: [
      { id: 1, name: "Titanic", size: "XL", arrivalDay: 1, duration: 5 },
      { id: 2, name: "Evergreen", size: "M", arrivalDay: 2, duration: 3 },
      { id: 3, name: "MSC", size: "L", arrivalDay: 3, duration: 7 },
      { id: 4, name: "Maersk", size: "S", arrivalDay: 1, duration: 2 },
    ],
    berths: [
      { 
        id: 1, 
        name: "XL-1", 
        size: "XL", 
        isOccupiedNow: true,
        assignments: [{ shipId: 1, shipName: "Titanic", startDay: 1, endDay: 6 }]
      },
      { id: 2, name: "XL-2", size: "XL", isOccupiedNow: false, assignments: [] },
      { id: 3, name: "L-1", size: "L", isOccupiedNow: false, assignments: [] },
      { id: 4, name: "L-2", size: "L", isOccupiedNow: false, assignments: [] },
      { id: 5, name: "M-1", size: "M", isOccupiedNow: false, assignments: [] },
      { id: 6, name: "M-2", size: "M", isOccupiedNow: false, assignments: [] },
      { id: 7, name: "S-1", size: "S", isOccupiedNow: false, assignments: [] },
      { id: 8, name: "S-2", size: "S", isOccupiedNow: false, assignments: [] },
    ]
  },
  
  // Navi per Operator
  ships: [
    { id: 1, name: "Titanic", size: "XL", arrivalDay: "2024-01-01", duration: 5, status: "Assigned" },
    { id: 2, name: "Evergreen", size: "M", arrivalDay: "2024-01-02", duration: 3, status: "Pending" },
    { id: 3, name: "MSC", size: "L", arrivalDay: "2024-01-03", duration: 7, status: "Pending" },
    { id: 4, name: "Maersk", size: "S", arrivalDay: "2024-01-01", duration: 2, status: "Departed" },
    { id: 5, name: "Naki", size: "M", arrivalDay: "2024-01-04", duration: 4, status: "Pending" },
  ],
  
  // Giorno corrente
  currentDay: 1,
  
  // Assegnazione
  assignment: { shipId: 1, name: "Titanic", berthId: 1, occupationStartDay: 1, status: "Assigned" }
};