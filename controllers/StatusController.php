<?php
// controllers/StatusController.php

require_once dirname(__DIR__) . '/config/Database.php';

class StatusController {
    private $conn;
    private $table_name = "status";

    // Ajuste para o nome real da tabela de pedidos e da coluna que guarda o status
    private $tabela_pedidos = "pedidos";
    private $coluna_status_pedidos = "id_status";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    private function responder(int $codigo, array $dados): void {
        http_response_code($codigo);
        echo json_encode($dados);
    }

    private function lerEntrada(): array {
        $input = json_decode(file_get_contents('php://input'), true);
        return is_array($input) ? $input : $_POST;
    }

    public function processRequest($method, $id = null) {
        switch ($method) {
            case 'GET':
                $id ? $this->buscar($id) : $this->listar();
                break;

            case 'POST':
                $this->criar();
                break;

            case 'PUT':
                if ($id) {
                    $this->atualizar($id);
                } else {
                    $this->responder(400, ['sucesso' => false, 'mensagem' => 'ID não informado para atualização.']);
                }
                break;

            case 'DELETE':
                if ($id) {
                    $this->excluir($id);
                } else {
                    $this->responder(400, ['sucesso' => false, 'erro' => 'ID inválido', 'mensagem' => 'ID não informado para exclusão.']);
                }
                break;

            default:
                $this->responder(405, ['sucesso' => false, 'mensagem' => 'Método não permitido.']);
        }
    }

    public function listar() {
        try {
            $query = "SELECT * FROM {$this->table_name} ORDER BY ordem ASC, id_status ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        } catch (Throwable $e) {
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao listar status: ' . $e->getMessage()]);
        }
    }

    public function buscar($id) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM {$this->table_name} WHERE id_status = ?");
            $stmt->execute([$id]);
            $status = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($status) {
                echo json_encode($status);
            } else {
                $this->responder(404, ['sucesso' => false, 'mensagem' => 'Status não encontrado.']);
            }
        } catch (Throwable $e) {
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao buscar status: ' . $e->getMessage()]);
        }
    }

    public function criar() {
        try {
            $input = $this->lerEntrada();

            // Reordenação (o front envia POST com { ordens: [...] })
            if (!empty($input['ordens']) && is_array($input['ordens'])) {
                $this->reordenar($input['ordens']);
                return;
            }

            $descricao = trim($input['descricao'] ?? $input['status'] ?? '');
            if ($descricao === '') {
                $this->responder(400, ['sucesso' => false, 'mensagem' => 'A descrição do status é obrigatória.']);
                return;
            }

            if (isset($input['ordem']) && $input['ordem'] !== '') {
                $ordem = (int) $input['ordem'];
            } else {
                $ordem = (int) $this->conn->query("SELECT COALESCE(MAX(ordem), 0) + 1 FROM {$this->table_name}")->fetchColumn();
            }

            $stmt = $this->conn->prepare("INSERT INTO {$this->table_name} (descricao, ordem, ativo) VALUES (?, ?, 1)");
            $stmt->execute([$descricao, $ordem]);

            $this->responder(201, ['sucesso' => true, 'mensagem' => 'Status criado com sucesso!']);
        } catch (Throwable $e) {
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao criar status: ' . $e->getMessage()]);
        }
    }

    private function reordenar(array $ordens) {
        try {
            $this->conn->beginTransaction();
            $stmt = $this->conn->prepare("UPDATE {$this->table_name} SET ordem = ? WHERE id_status = ?");
            foreach ($ordens as $item) {
                $stmt->execute([(int) $item['ordem'], (int) $item['id']]);
            }
            $this->conn->commit();

            $this->responder(200, ['sucesso' => true, 'mensagem' => 'Ordem atualizada com sucesso!']);
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) $this->conn->rollBack();
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao reordenar: ' . $e->getMessage()]);
        }
    }

    public function atualizar($id) {
        try {
            $input = $this->lerEntrada();

            // Apenas ativar/desativar (switch da tabela)
            if (!empty($input['somenteAtivo'])) {
                $stmt = $this->conn->prepare("UPDATE {$this->table_name} SET ativo = ? WHERE id_status = ?");
                $stmt->execute([(int) ($input['ativo'] ?? 0), $id]);

                $this->responder(200, ['sucesso' => true, 'mensagem' => 'Situação atualizada com sucesso!']);
                return;
            }

            $descricao = trim($input['descricao'] ?? $input['status'] ?? '');
            if ($descricao === '') {
                $this->responder(400, ['sucesso' => false, 'mensagem' => 'A descrição do status é obrigatória.']);
                return;
            }

            if (isset($input['ordem']) && $input['ordem'] !== '') {
                $stmt = $this->conn->prepare("UPDATE {$this->table_name} SET descricao = ?, ordem = ? WHERE id_status = ?");
                $stmt->execute([$descricao, (int) $input['ordem'], $id]);
            } else {
                $stmt = $this->conn->prepare("UPDATE {$this->table_name} SET descricao = ? WHERE id_status = ?");
                $stmt->execute([$descricao, $id]);
            }

            $this->responder(200, ['sucesso' => true, 'mensagem' => 'Status atualizado com sucesso!']);
        } catch (Throwable $e) {
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao atualizar status: ' . $e->getMessage()]);
        }
    }

    private function emUso($id): bool {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->tabela_pedidos} WHERE {$this->coluna_status_pedidos} = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (Throwable $e) {
            // Tabela ou coluna com outro nome: não bloqueia, o banco decide (FK)
            return false;
        }
    }

    public function excluir($id) {
        try {
            if ($this->emUso($id)) {
                $this->responder(400, [
                    'sucesso' => false,
                    'erro' => 'Status em uso',
                    'mensagem' => 'Este status está em uso e não pode ser excluído. Desative-o no switch "Ativo".'
                ]);
                return;
            }

            $stmt = $this->conn->prepare("DELETE FROM {$this->table_name} WHERE id_status = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->responder(404, ['sucesso' => false, 'erro' => 'Não encontrado', 'mensagem' => 'Status não encontrado.']);
                return;
            }

            $this->responder(200, ['sucesso' => true, 'mensagem' => 'Status excluído com sucesso!']);
        } catch (PDOException $e) {
            // 23000 = violação de chave estrangeira
            if ($e->getCode() === '23000') {
                $this->responder(400, [
                    'sucesso' => false,
                    'erro' => 'Status em uso',
                    'mensagem' => 'Este status está em uso e não pode ser excluído. Desative-o no switch "Ativo".'
                ]);
                return;
            }
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao excluir status: ' . $e->getMessage()]);
        } catch (Throwable $e) {
            $this->responder(500, ['sucesso' => false, 'mensagem' => 'Erro ao excluir status: ' . $e->getMessage()]);
        }
    }
}