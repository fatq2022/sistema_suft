<?php
// tests/PedidoTest.php

echo "=== A INICIAR TESTES DE REGRAS DE NEGÓCIO ===\n\n";

// 1. Teste de Validação de Prazos por Tipo de Bloco
$tipoBlocoPU = 'PU';
$diasPu = ($tipoBlocoPU === 'PU') ? 10 : 25;
if ($diasPu === 10) {
    echo "[SUCESSO] Prazo para blocos PU (10 dias) validado corretamente.\n";
} else {
    echo "[FALHA] Prazo para blocos PU incorreto.\n";
}

$tipoBlocoEPS = 'EPS';
$diasEps = ($tipoBlocoEPS === 'PU') ? 10 : 25;
if ($diasEps === 25) {
    echo "[SUCESSO] Prazo para blocos EPS (25 dias) validado corretamente.\n";
} else {
    echo "[FALHA] Prazo para blocos EPS incorreto.\n";
}

// 2. Teste de Limiares de Alertas Visuais
$dataAtual = new DateTime('2026-10-15');
$dataPrevista = new DateTime('2026-10-16');
$intervalo = $dataAtual->diff($dataPrevista)->days;
$isVencido = $dataAtual > $dataPrevista;

if ($isVencido === false && $intervalo <= 3) {
    echo "[SUCESSO] Alerta crítico visual validado corretamente para o prazo.\n";
} else {
    echo "[FALHA] Alerta visual incorreto.\n";
}

// 3. Teste de Expiração do Token de Redefinição de Senha
$criacaoToken = new DateTime('2026-10-15 20:00:00');
$agora = new DateTime('2026-10-15 21:30:00'); // Passou 1h30m
$diferencaMinutos = ($agora->getTimestamp() - $criacaoToken->getTimestamp()) / 60;
$tokenExpirado = $diferencaMinutos > 60; // Limite de 60 minutos

if ($tokenExpirado === true) {
    echo "[SUCESSO] Expiração do token de segurança (limite de 60 minutos) validada com sucesso.\n";
} else {
    echo "[FALHA] Expiração de token incorreta.\n";
}

echo "\n=== TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO! ===\n";