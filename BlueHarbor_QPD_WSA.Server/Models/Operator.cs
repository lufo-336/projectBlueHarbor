using System;

public class Operator : User
{
    // Campo privato specifico di Operator
    private string role;

    public string Role
    {
        get => role;
        set
        {
            if (value != "Admin" && value != "Operator")
            {
                // Nota: la sintassi corretta di ArgumentException è (messaggio, nomeParametro)
                throw new ArgumentException("Role must be 'Admin' or 'Operator'.", nameof(value));
            }
            role = value;
        }
    }

    // IL COSTRUTTORE CORRETTO:
    // Accetta i dati per il padre + il dato per se stesso
    public Operator(int id, string name, string surname, string email, string password, string role)
        : base(id, name, surname, email, password) // Passa i dati al costruttore di User
    {
        // Qui gestisci SOLO la proprietà specifica di Operator
        Role = role;
    }
}