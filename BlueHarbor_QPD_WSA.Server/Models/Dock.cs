using System;

namespace BlueHarbor.Models
{
    public class Dock
    {
        private int id;
        private string dimension;

        public int Id { get => id; set => id = value; }

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
        } // <--- Mancava questa graffa di chiusura della proprietà

        public Dock(int id, string dimension)
        {
            Id = id;
            Dimension = dimension;
        }
    }
}