<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/Database.php';

class Usuario
{
    private PDO $conn;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function buscaUsuario(string $usuario): array|false
    {
        $stmt = $this->conn->prepare(
            'SELECT * FROM usuario WHERE usuario = ? LIMIT 1'
        );
        $stmt->execute([$usuario]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
