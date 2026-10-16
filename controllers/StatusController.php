<?php
// controllers/StatusController.php

require_once dirname(__DIR__) . '/config/Database.php';

class StatusController {
    private $conn;
    private $table_name = "status"; // Nome da tabela no banco

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
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY id_status ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $statusList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($statusList ?: []);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar status: ' . $e->getMessage()]);
        }
    }

    public function buscar($id) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id_status = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
            $status = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($status) {
                echo json_encode($status);
            } else {
                http_response_code(404);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Status não encontrado.']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao buscar status: ' . $e->getMessage()]);
        }
    }
}