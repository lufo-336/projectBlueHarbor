using System;

public abstract class User
{
    // 1. Campi privati (posizionati dentro la classe, non nel costruttore)
    private int id;
    private string name;
    private string surname;
    private string email;
    private string password;

    // 2. Proprietà pubbliche per accedere ai campi
    public int Id { get => id; set => id = value; }
    public string Name { get => name; set => name = value; }
    public string Surname { get => surname; set => surname = value; }
    public string Email { get => email; set => email = value; }
    public string Password { get => password; set => password = value; }

    // 3. Il costruttore della classe padre
    public User(int id, string name, string surname, string email, string password)
    {
        Id = id;
        Name = name;
        Surname = surname;
        Email = email;
        Password = password;
    }
}