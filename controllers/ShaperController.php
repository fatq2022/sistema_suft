<?php
// controllers/ShaperController.php

require_once dirname(__DIR__) . '/config/Database.php';

class ShaperController {
    private $conn;
    private $table_name = "shaper"; // Nome da tabela no singular conforme o banco de dados

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function processRequest($method, $id = null) {
        if ($method === 'GET') {
            if ($id) {
                $this->buscar($id);
            } else {
                $this->listar();
            }
        } else {
            http_response_code(405);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
        }
    }

    public function listar() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY nome ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $shapers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($shapers ?: []);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar shapers: ' . $e->getMessage()]);
        }
    }

    public function buscar($id) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id_shaper = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
            $shaper = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($shaper) {
                echo json_encode($shaper);
            } else {
                http_response_code(404);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Shaper não encontrado.']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao buscar shaper: ' . $e->getMessage()]);
        }
    }
}