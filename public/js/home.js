// home.js - Versão Blindada contra FetchError
let dashboardCarregado = false;
let pedidoCarregado = false;
let statusCarregado = false;
let shaperCarregado = false;

window.formatarDataBR = function (dataSQL) {
  if (!dataSQL || dataSQL === "0000-00-00") return "-";
  const partes = dataSQL.split(" ")[0].split("-");
  if (partes.length !== 3) return dataSQL;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

window.mascaraTelefone = function (input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (v.length > 5) {
    v = v.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d+)/, "($1) $2");
  } else if (v.length > 0) {
    v = v.replace(/^(\d+)/, "($1");
  }
  input.value = v;
};

async function carregarUsuario() {
  try {
    const baseUrl = window.BASE_URL || '/sistema';
    const response = await fetch(`${baseUrl}/api/usuario`);
    if (!response.ok) return;
    const data = await response.json();

    if (data && data.nome) {
      window.usuarioId = data.id_usuario;
      const elUsuario = document.getElementById("usuario-logado");
      if (elUsuario) {
        elUsuario.innerHTML = `<i class="fa-solid fa-user"></i> ${data.usuario} | ${data.nome}`;
      }
      initTooltips();
    }
  } catch (erro) {
    console.warn("Aviso ao carregar utilizador:", erro);
  }
}

async function carregarDashboard() {
  try {
    if (!dashboardCarregado) {
      const baseUrl = window.BASE_URL || '/sistema';
      const response = await fetch(`${baseUrl}/views/dashboard/index.php`);
      if (response.ok) {
        const html = await response.text();
        const container = document.getElementById("conteudo-dashboard");
        if (container) {
          container.innerHTML = html;
          dashboardCarregado = true;
          initTooltips();
        }
      }
    }
    if (window.atualizarDashboard) window.atualizarDashboard();
  } catch (erro) {
    console.warn("Aviso dashboard:", erro);
  }
}

async function carregarPedido() {
  try {
    if (typeof resetVisualAbas === "function") resetVisualAbas("pedido");
    if (typeof window.dadosPedidosAtuais !== "undefined") window.dadosPedidosAtuais = [];

    if (!pedidoCarregado) {
      const baseUrl = window.BASE_URL || '/sistema';
      const response = await fetch(`${baseUrl}/views/pedido/index.php`);
      if (response.ok) {
        const html = await response.text();
        const containerPedido = document.getElementById("conteudo-pedido");
        if (containerPedido) {
          containerPedido.innerHTML = html;
        }
        pedidoCarregado = true;
      }
    }

    if (window.popularSelects) await window.popularSelects();
    if (window.listarPedidos) window.listarPedidos(window.colunaOrdenacaoAtual);
    if (window.initPedidoStatus) window.initPedidoStatus();
    if (window.vincularEventosTabs) window.vincularEventosTabs();
    initTooltips();
  } catch (erro) {
    console.warn("Aviso ao carregar pedido:", erro);
  }
}

async function carregarStatus() {
  try {
    if (!statusCarregado) {
      const baseUrl = window.BASE_URL || '/sistema';
      const response = await fetch(`${baseUrl}/views/status/index.php`);
      if (response.ok) {
        const html = await response.text();
        const containerStatus = document.getElementById("conteudo-status");
        if (containerStatus) {
          containerStatus.innerHTML = html;
        }
        statusCarregado = true;
      }
    }
    if (window.listarStatus) window.listarStatus();
    initTooltips();
  } catch (erro) {
    console.warn("Aviso ao carregar status:", erro);
  }
}

async function carregarShaper() {
  try {
    if (!shaperCarregado) {
      const baseUrl = window.BASE_URL || '/sistema';
      const response = await fetch(`${baseUrl}/views/shaper/index.php`);
      if (response.ok) {
        const html = await response.text();
        const containerShaper = document.getElementById("conteudo-shaper");
        if (containerShaper) {
          containerShaper.innerHTML = html;
        }
        shaperCarregado = true;
      }
    }
    if (window.listarShapers) window.listarShapers();
    initTooltips();
  } catch (erro) {
    console.warn("Aviso ao carregar shaper:", erro);
  }
}

function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTooltips();
  carregarDashboard();
  carregarUsuario();
});

window.atualizarDashboard = async function () {
  const elPedidos = document.getElementById("cardTotalPedidos");
  const elShapers = document.getElementById("cardTotalShapers");
  const containerStatus = document.getElementById("containerStatusDinamico");

  try {
    const baseUrl = window.BASE_URL || '/sistema';
    const [resP, resS, resSt] = await Promise.all([
      fetch(`${baseUrl}/api/pedidos?t=${Date.now()}`),
      fetch(`${baseUrl}/api/shapers?t=${Date.now()}`),
      fetch(`${baseUrl}/api/status?t=${Date.now()}`),
    ]);

    if (!resP.ok || !resS.ok || !resSt.ok) return;

    const pedidos = await resP.json();
    const shapers = await resS.json();
    const statusList = await resSt.json();

    if (elPedidos) elPedidos.innerText = pedidos.length || 0;
    if (elShapers) elShapers.innerText = shapers.length || 0;

    if (containerStatus && Array.isArray(statusList)) {
      const contagemStatus = {};
      let totalSemStatus = 0;

      statusList.forEach((s) => { contagemStatus[s.id] = 0; });

      if (Array.isArray(pedidos)) {
        pedidos.forEach((p) => {
          if (!p.status_ids || p.status_ids.trim() === "") {
            totalSemStatus++;
          } else {
            const ids = p.status_ids.split(",").map((id) => parseInt(id.trim()));
            const idMaisRecente = Math.max(...ids);
            if (contagemStatus[idMaisRecente] !== undefined) {
              contagemStatus[idMaisRecente]++;
            }
          }
        });
      }

      let htmlGerado = `
        <div class="col-md-3 col-6 mb-3">
            <div class="card text-bg-primary mb-3 shadow-sm border-0 h-100">
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-white-50 text-uppercase fw-bold" style="font-size: 0.7rem;">Total Geral</h6>
                    <h2 class="card-title mb-0 fw-bold">${pedidos.length || 0}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
            <div class="card text-bg-danger mb-3 shadow-sm border-0 h-100">
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-white-50 text-uppercase fw-bold" style="font-size: 0.7rem;">Sem Status</h6>
                    <h2 class="card-title mb-0 fw-bold">${totalSemStatus}</h2>
                </div>
            </div>
        </div>
      `;

      statusList.forEach((st) => {
        const total = contagemStatus[st.id] || 0;
        htmlGerado += `
          <div class="col-md-3 col-6 mb-3">
              <div class="card text-bg-light mb-3 shadow-sm border-0 h-100">
                  <div class="card-body">
                      <h6 class="card-subtitle mb-2 text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">${st.descricao}</h6>
                      <h2 class="card-title mb-0 fw-bold">${total}</h2>
                  </div>
              </div>
          </div>
        `;
      });

      containerStatus.innerHTML = htmlGerado;
    }
  } catch (erro) {
    console.warn("Aviso ao atualizar dashboard:", erro);
  }
};