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
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

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
    $controller->processRequest($method, $id);
} catch (Throwable $e) {
    error_log('Erro na API: ' . $e->getMessage());
    http_response_code(500);
    // Exibe a mensagem real do erro para sabermos exatamente o que falhou
    echo json_encode([
        'sucesso' => false, 
        'mensagem' => 'Erro detalhado: ' . $e->getMessage(),
        'arquivo' => $e->getFile(),
        'linha' => $e->getLine()
    ]);
}
exit;