<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Extrai e divide a URL para preencher o array $uri corretamente
$url = $_GET['url'] ?? '';
$uri = explode('/', trim($url, '/'));

$subRecurso = $uri[1] ?? null;
$id = $uri[2] ?? null;

// ===== CORREÇÃO: suporte a method override (_method) vindo do JSON =====
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$rawBody = file_get_contents('php://input');
$jsonBody = [];
if ($rawBody !== false && $rawBody !== '') {
    $decoded = json_decode($rawBody, true);
    if (is_array($decoded)) {
        $jsonBody = $decoded;
    }
}

if ($method === 'POST') {
    $override = $jsonBody['_method'] ?? $_POST['_method'] ?? null;
    if ($override !== null) {
        $override = strtoupper((string) $override);
        if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
            $method = $override;
        }
    }
}

// Se a URL veio sem ID, tenta pegar do corpo (apenas para PUT/PATCH/DELETE)
if (($id === null || $id === '') && in_array($method, ['PUT', 'PATCH', 'DELETE'], true)) {
    if (isset($jsonBody['id']) && $jsonBody['id'] !== '') {
        $id = (string) $jsonBody['id'];
    }
}
// =======================================================================

if ($subRecurso === 'login') {
    if ($method !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
        exit;
    }

    require_once dirname(__DIR__) . '/controllers/AuthController.php';
    (new AuthController())->login();
    exit;
}

if ($subRecurso === 'logout') {
    if (empty($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Não autorizado.']);
        exit;
    }
    require_once dirname(__DIR__) . '/controllers/AuthController.php';
    (new AuthController())->logout();
    exit;
}

if (empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Não autorizado.']);
    exit;
}

if ($subRecurso === 'usuario') {
    require_once dirname(__DIR__) . '/models/Usuario.php';
    try {
        $usuarioModel = new Usuario();
        $usuario = $usuarioModel->buscaUsuario((string) $_SESSION['user']);
        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não encontrado.']);
            exit;
        }
        echo json_encode([
            'usuario' => $usuario['usuario'] ?? null,
            'nome' => $usuario['nome'] ?? null
        ]);
    } catch (Throwable $e) {
        error_log('Erro ao consultar usuário: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao consultar usuário.']);
    }
    exit;
}

$map = [
    'shapers' => 'ShaperController',
    'cores' => 'CorController',
    'composicoes' => 'ComposicaoController',
    'variacoes' => 'VariacaoController',
    'acabamentos' => 'AcabamentoController',
    'tecidos' => 'TecidoController',
    'configuracaoquilhas' => 'ConfiguracaoquilhaController',
    'sistemaquilhas' => 'SistemaquilhaController',
    'pedidos' => 'PedidoController',
    'pedidos-status' => 'PedidoStatusController',
    'status' => 'StatusController',
];

if (!isset($map[$subRecurso])) {
    http_response_code(404);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Rota da API não encontrada.']);
    exit;
}

$controllerName = $map[$subRecurso];
$controllerFile = dirname(__DIR__) . '/controllers/' . $controllerName . '.php';

if (!is_file($controllerFile)) {
    error_log('Controller não encontrado: ' . $controllerFile);
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Arquivo do controlador não encontrado.']);
    exit;
}

try {
    require_once $controllerFile;
    $controller = new $controllerName();

    if (method_exists($controller, 'processRequest')) {
        $controller->processRequest($method, $id);
    } else {
        $action = strtolower($method);
        switch ($method) {
            case 'GET':
                $action = $id ? 'show' : 'index';
                break;
            case 'POST':
                $action = 'store';
                break;
            case 'PUT':
            case 'PATCH':
                $action = 'update';
                break;
            case 'DELETE':
                $action = 'destroy';
                break;
        }

        if (method_exists($controller, $action)) {
            if ($id !== null) {
                $controller->$action($id);
            } else {
                $controller->$action();
            }
        } else {
            http_response_code(405);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Método HTTP não permitido para este recurso.']);
        }
    }
} catch (Throwable $e) {
    error_log('Erro na API: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro detalhado: ' . $e->getMessage(),
        'arquivo' => $e->getFile(),
        'linha' => $e->getLine()
    ]);
}
exit;