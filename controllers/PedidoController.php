<?php
// controllers/PedidoController.php

require_once dirname(__DIR__) . '/config/Database.php';

class PedidoController {
    private $conn;
    private $table_name = "pedido";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function processRequest($method, $id = null) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->buscar($id);
                } else {
                    $this->listar();
                }
                break;
            case 'POST':
                $this->criar();
                break;
            case 'PUT':
                if ($id) {
                    $this->atualizar($id);
                } else {
                    http_response_code(400);
                    echo json_encode(['sucesso' => false, 'mensagem' => 'ID não informado para atualização.']);
                }
                break;
            case 'DELETE':
                if ($id) {
                    $this->deletar($id);
                } else {
                    http_response_code(400);
                    echo json_encode(['sucesso' => false, 'mensagem' => 'ID não informado para exclusão.']);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
                break;
        }
    }

    public function listar() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY id_pedido DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($pedidos ?: []);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar pedidos: ' . $e->getMessage()]);
        }
    }

    public function buscar($id) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id_pedido = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($pedido) {
                echo json_encode($pedido);
            } else {
                http_response_code(404);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Pedido não encontrado.']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao buscar pedido: ' . $e->getMessage()]);
        }
    }

    public function criar() {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            
            $query = "INSERT INTO " . $this->table_name . " 
                     (data, id_shaper, id_composicao, id_variacao, id_acabamento, id_configuracaoquilha, id_sistemaquilha, observacao, tipo_bloco, data_prevista) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $sucesso = $stmt->execute([
                $data['data'] ?? date('Y-m-d'),
                $data['id_shaper'] ?? null,
                $data['id_composicao'] ?? null,
                $data['id_variacao'] ?? null,
                $data['id_acabamento'] ?? null,
                $data['id_configuracaoquilha'] ?? null,
                $data['id_sistemaquilha'] ?? null,
                $data['observacao'] ?? '',
                $data['tipo_bloco'] ?? '',
                $data['data_prevista'] ?? null
            ]);

            if ($sucesso) {
                // Notificação de e-mail ao criar o pedido (Opcional/Integrado)
                $this->enviarNotificacaoEmail($this->conn->lastInsertId(), 'Criado');

                echo json_encode(['sucesso' => true, 'mensagem' => 'Pedido criado com sucesso.']);
            } else {
                http_response_code(500);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível criar o pedido.']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao criar pedido: ' . $e->getMessage()]);
        }
    }

    public function atualizar($id) {
        try {
            $data = json_decode(file_get_contents("php://input"), true);

            $query = "UPDATE " . $this->table_name . " 
                     SET data = ?, id_shaper = ?, id_composicao = ?, id_variacao = ?, id_acabamento = ?, id_configuracaoquilha = ?, id_sistemaquilha = ?, observacao = ?, tipo_bloco = ?, data_prevista = ? 
                     WHERE id_pedido = ?";

            $stmt = $this->conn->prepare($query);
            $sucesso = $stmt->execute([
                $data['data'] ?? date('Y-m-d'),
                $data['id_shaper'] ?? null,
                $data['id_composicao'] ?? null,
                $data['id_variacao'] ?? null,
                $data['id_acabamento'] ?? null,
                $data['id_configuracaoquilha'] ?? null,
                $data['id_sistemaquilha'] ?? null,
                $data['observacao'] ?? '',
                $data['tipo_bloco'] ?? '',
                $data['data_prevista'] ?? null,
                $id
            ]);

            if ($sucesso) {
                // Notificação de e-mail ao atualizar o pedido / mudança para produção
                $this->enviarNotificacaoEmail($id, 'Atualizado / Em Produção');

                echo json_encode(['sucesso' => true, 'mensagem' => 'Pedido atualizado com sucesso.']);
            } else {
                http_response_code(500);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível atualizar o pedido.']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao atualizar pedido: ' . $e->getMessage()]);
        }
    }

    public function deletar($id) {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id_pedido = ?";
            $stmt = $this->conn->prepare($query);
            $sucesso = $stmt->execute([$id]);

            if ($sucesso) {
                echo json_encode(['sucesso' => true, 'mensagem' => 'Pedido excluído com sucesso.']);
            } else {
                http_response_code(500);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível excluir o pedido.']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir pedido: ' . $e->getMessage()]);
        }
    }

    /**
     * Função auxiliar para envio de e-mail de notificação (Brevo / SendGrid / SMTP)
     */
    private function enviarNotificacaoEmail($idPedido, $statusAcao) {
        try {
            // Aqui você pode configurar o envio via API cURL (ex: Brevo/SendGrid) ou função mail()
            // Exemplo básico de log ou disparo simulado seguro:
            $assunto = "Atualização no Pedido #{$idPedido}";
            $mensagem = "O seu pedido ID {$idPedido} teve uma atualização de status: {$statusAcao}.";
            
            // Exemplo de registo no log do sistema para auditoria
            if (class_exists('Logger')) {
                Logger::log("E-mail simulado enviado para o pedido {$idPedido} - Status: {$statusAcao}");
            }
        } catch (Throwable $e) {
            // Garante que falhas no e-mail não quebrem a resposta JSON principal da API
            error_log("Erro ao enviar e-mail: " . $e->getMessage());
        }
    }
}
/**
     * Função auxiliar para envio de e-mail de notificação real via API cURL (Brevo / SendGrid)
     */
    private function enviarNotificacaoEmail($idPedido, $statusAcao, $emailDestinatario = 'cliente@exemplo.com') {
        try {
            // Substitua pela sua chave de API real obtida no painel da Brevo / SendGrid
            $apiKey = 'xkeysib-sua-chave-de-api-aqui'; 
            $url = 'https://api.brevo.com/v3/smtp/email';

            $assunto = "Atualização no Pedido #{$idPedido} - Sistema de Laminação";
            $htmlContent = "
                <h2>Olá!</h2>
                <p>O seu pedido <strong>#{$idPedido}</strong> teve uma nova atualização de status:</p>
                <p style='color: #0d6efd; font-size: 16px;'><strong>Status atual: {$statusAcao}</strong></p>
                <p>Acesse o sistema para verificar os detalhes da data prevista de entrega e o progresso da produção do seu bloco (PU/EPS).</p>
                <br>
                <p><em>Atenciosamente,<br>Equipa de Controle de Laminação</em></p>
            ";

            $dadosEnvio = [
                'sender' => [
                    'name' => 'Controle de Laminação', 
                    'email' => 'seu-email-verificado@dominio.com'
                ],
                'to' => [
                    ['email' => $emailDestinatario]
                ],
                'subject' => $assunto,
                'htmlContent' => $htmlContent
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dadosEnvio));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'accept: application/json',
                'api-key: ' . $apiKey,
                'content-type: application/json'
            ]);

            $resposta = curl_exec($ch);
            $erro = curl_error($ch);
            curl_close($ch);

            if ($erro) {
                error_log("Erro cURL ao enviar e-mail: " . $erro);
            } else {
                if (class_exists('Logger')) {
                    Logger::log("E-mail disparado via API Brevo para o pedido {$idPedido}");
                }
            }
        } catch (Throwable $e) {
            // Garante que falhas na API de e-mail não quebrem a resposta JSON principal da API
            error_log("Erro crítico ao enviar e-mail: " . $e->getMessage());
        }
    }
}