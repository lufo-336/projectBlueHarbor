using Microsoft.Data.SqlClient;
using BlueHarbor.Models;
using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace BlueHarbor.Data
{
    public class ShipRepository
    {
        private readonly string _connectionString;

        public ShipRepository(IConfiguration configuration)
        {
            // Il '?? throw' risolve i due avvisi (Warning) sulla stringa di connessione potenzialmente nulla
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("La stringa di connessione 'DefaultConnection' non è stata trovata.");
        }

        public List<Ship> GetShipsPending()
        {
            var listaNavi = new List<Ship>();

            // Ho allineato i nomi delle colonne SQL con quelli che usi sotto nel Reader
            string query = "SELECT Id, Name, Dimension, ArrivalDay, OccupancyDuration, State FROM Navi WHERE State = 'Pending'";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    connection.Open();

                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            // CORRETTO: Convertito l'Id in Int32 per matchare il costruttore di Ship
                            Ship nave = new Ship(
                                Convert.ToInt32(reader["Id"]),
                                reader["Name"].ToString()
                            );

                            // CORRETTO: Nomi colonne allineati alla query SQL senza spazi extra
                            nave.Dimension = reader["Dimension"].ToString();
                            nave.ArrivalDay = Convert.ToInt32(reader["ArrivalDay"]);
                            nave.OccupancyDuration = Convert.ToInt32(reader["OccupancyDuration"]);
                            nave.State = reader["State"].ToString();

                            listaNavi.Add(nave);
                        }
                    }
                }
            }
            return listaNavi;
        }
    }
}