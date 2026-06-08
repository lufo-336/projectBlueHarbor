using System; // <--- Messo in cima con la S maiuscola

namespace BlueHarbor.Models
{
    public class Ship
    {
        // Oggetto Random condiviso per evitare duplicati nei calcoli veloci
        private static readonly Random _random = new Random();

        private int id;
        private string name;
        private string dimension;
        private int arrival_day; // <--- Corretto l'errore di battitura (aveva 3 'r')
        private int occupancy_duration;
        private string notes; // Se non la usi puoi lasciarla o toglierla
        private string state;

        public int Id { get => id; set => id = value; }
        public string Name { get => name; set => name = value; }

        public string Dimension
        {
            get => dimension;
            set
            {
                if (value != "S" && value != "M" && value != "L" && value != "XL")
                {
                    throw new ArgumentException("Dimension must be 'S', 'M', 'L' or 'XL'.", nameof(value));
                }
                dimension = value;
            }
        } // <--- Mancava questa graffa

        public int ArrivalDay
        {
            get => arrival_day;
            set
            {
                if (value < 0 || value > 30)
                {
                    throw new ArgumentOutOfRangeException(nameof(value), "Arrival day must be between 0 and 30.");
                }
                arrival_day = value;
            }
        }

        public int OccupancyDuration
        {
            get => occupancy_duration;
            set
            {
                if (value < 3 || value > 15)
                {
                    throw new ArgumentOutOfRangeException(nameof(value), "Occupancy duration must be between 3 and 15 days.");
                }
                occupancy_duration = value;
            }
        }

        public string State
        {
            get => state;
            set
            {
                if (value != "Pending" && value != "Assigned" && value != "Departed")
                {
                    throw new ArgumentException("The state must be 'Pending', 'Assigned' or 'Departed'.", nameof(value));
                }
                state = value;
            }
        } // <--- Mancava questa graffa

        // Primo Costruttore completo
        public Ship(int id, string name, string dimension, int arrival_day, int occupancy_duration, string state)
        {
            Id = id;
            Name = name;
            Dimension = dimension;
            ArrivalDay = arrival_day;
            OccupancyDuration = occupancy_duration;
            State = state;
        }

        // Secondo Costruttore con dati randomici
        public Ship(int id, string name)
        {
            Id = id;
            Name = name;
            State = "Pending";
            Dimension = RandomDimension();
            ArrivalDay = RandomArrivalDay();
            OccupancyDuration = RandomOccupancyDuration();
        }

        // Metodi Random migliorati usando l'istanza condivisa _random
        public int RandomArrivalDay()
        {
            return _random.Next(0, 31);
        }

        public int RandomOccupancyDuration()
        {
            return _random.Next(3, 16);
        }

        public string RandomDimension()
        {
            string[] dimensioni = { "S", "M", "L", "XL" };
            return dimensioni[_random.Next(dimensioni.Length)];
        }

        public override string ToString()
        {
            return $"Ship [Id={Id}, Name={Name}, Dimension={Dimension}, ArrivalDay={ArrivalDay}, OccupancyDuration={OccupancyDuration}, State={State}]";
        }
    } // <--- Mancava la chiusura della classe
}