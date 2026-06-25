namespace BlueHarbor_QPD_WSA.Server.Services
{
    /// <summary>
    /// Regole di dominio dello Scheduler scritte come funzioni PURE:
    /// non leggono il database, ricevono tutto via parametri, restituiscono un valore.
    /// Il controller legge i dati dal DB e li passa qui. Cosi' sono facili da testare.
    /// </summary>
    public static class SchedulingRules
    {
        // TASK 1 — fatta.
        public static bool IsCompatible(string shipSize, string BerthType)
        {
            return shipSize.Equals(BerthType, StringComparison.OrdinalIgnoreCase);
        }

        // TASK 2 — da completare.
        // Trova il PRIMO giorno con un buco libero lungo almeno `duration`,
        // non prima dell'arrivo della nave ne' nel passato.
        // existingOccupations = occupazioni ATTIVE su QUESTA banchina, ognuna [Start, End) con End = Start + Duration.
        public static int ComputeOccupationStartDay(
            int arrivalDay,
            int duration,
            int currentDay,
            IReadOnlyList<(int Start, int End)> existingOccupations)
        {
            // --- TUTTO il codice va QUI DENTRO, tra le graffe del metodo ---

            // 1) Punto di partenza: non prima dell'arrivo, non nel passato.
            int candidate = Math.Max(arrivalDay, currentDay);

            // 2) Scorri le occupazioni in ordine di Start crescente.
            foreach (var occ in existingOccupations.OrderBy(o => o.Start))
            {
                // 3) C'e' un buco lungo almeno `duration` PRIMA di questa occupazione?
                //    Se si', il candidato attuale va bene: restituiscilo.
                // TODO (riga A): if (occ.Start >= candidate + duration) return candidate;
                if (occ.Start >= candidate + duration) return candidate;

                // 4) Altrimenti questa occupazione blocca: sposta il candidato a dopo la sua fine.
                // TODO (riga B): candidate = Math.Max(candidate, occ.End);
                candidate = Math.Max(candidate, occ.End);
            }

            // 5) Nessuna occupazione successiva blocca: parte da qui (in coda a tutto).
            return candidate;
        }
    }
}
