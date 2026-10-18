// Variáveis globais de controle
window.colunaOrdenacaoAtual = localStorage.getItem("pedido_ordem_coluna") || "id_pedido";
window.ordemAscendente = localStorage.getItem("pedido_ordem_dir") === "true";
window.dadosPedidosAtuais = [];
window.contextoAtual = null;
window.editIdGenerico = null;
window.editIdPedido = null;

let tecidosChoice = null;
let coresChoice = null;

const modalConfigs = {
  composicao: {
    icon: '<i class="fa-solid fa-flask"></i>',
    titulo: "Gerenciar Composição",
    label: "Composição",
    selectId: "id_composicaoPedido",
    recurso: "composicoes",
  },
  variacao: {
    icon: '<i class="fa-solid fa-sliders"></i>',
    titulo: "Gerenciar Variação",
    label: "Variação",
    selectId: "id_variacaoPedido",
    recurso: "variacoes",
  },
  acabamento: {
    icon: '<i class="fa-solid fa-brush"></i>',
    titulo: "Gerenciar Acabamento",
    label: "Acabamento",
    selectId: "id_acabamentoPedido",
    recurso: "acabamentos",
  },
  configQuilha: {
    icon: '<i class="fa-solid fa-sliders"></i>',
    titulo: "Gerenciar Config. Quilha",
    label: "Configuração de Quilha",
    selectId: "id_configuracaoquilhaPedido",
    recurso: "configuracaoquilhas",
  },
  sistemaQuilha: {
    icon: '<i class="fa-solid fa-sitemap"></i>',
    titulo: "Gerenciar Sistema Quilha",
    label: "Sistema de Quilha",
    selectId: "id_sistemaquilhaPedido",
    recurso: "sistemaquilhas",
  },
  cores: {
    icon: '<i class="fa-solid fa-fill-drip"></i>',
    titulo: "Gerenciar Cores",
    label: "Cor",
    selectId: "id_cor",
    recurso: "cores",
  },
  tecido: {
    icon: '<i class="fa-solid fa-layer-group"></i>',
    titulo: "Gerenciar Tecidos",
    label: "Tecido",
    selectId: "id_tecidoPedido",
    recurso: "tecidos",
  },
};

function apiUrlPedido(recurso, id = null) {
  const baseUrl = window.BASE_URL || '/sistema';
  if (id) return `${baseUrl}/api/${recurso}/${id}`;
  return `${baseUrl}/api/${recurso}`;
}

window.abrirModalGenerico = function (tipo) {
  window.contextoAtual = modalConfigs[tipo];
  window.editIdGenerico = null;

  if (!window.contextoAtual) return;

  const modalTitleEl = document.querySelector("#modalGenerico .modal-title");
  if (modalTitleEl) {
    modalTitleEl.innerHTML = window.contextoAtual.icon + " " + window.contextoAtual.titulo;
  }

  const input = document.getElementById("modalInput");
  if (input) {
    input.value = "";
    input.placeholder = window.contextoAtual.label;
  }

  resetModalState();
  carregarListaModal();

  const modalEl = document.getElementById("modalGenerico");
  if (modalEl && typeof bootstrap !== "undefined") {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
};

async function carregarListaModal() {
  if (!window.contextoAtual) return;

  try {
    const baseUrl = window.BASE_URL || '/sistema';
    const response = await fetch(`${baseUrl}/api/${window.contextoAtual.recurso}`);
    if (!response.ok) return;
    const data = await response.json();

    const lista = document.getElementById("listaComposicoesModal") || 
                document.getElementById("listaGenericaModal") || 
                document.getElementById("listaModal");
    
    if (!lista) return;
    lista.innerHTML = "";

    if (Array.isArray(data) && data.length > 0) {
      data.forEach((item) => {
        const idReal = item.id || item.id_composicao || item.id_variacao || item.id_acabamento || 
                       item.id_configuracaoquilha || item.id_sistemaquilha || item.id_cor || item.id_tecido;

        lista.innerHTML += `
        <tr>
            <td>${idReal}</td>
            <td>${item.descricao || item.nome || ""}</td>
            <td class="text-center align-middle">
              <div class="form-check form-switch d-inline-block">
                <input class="form-check-input" type="checkbox" role="switch" 
                  ${item.ativo == 1 ? "checked" : ""}
                  onchange="window.alternarAtivoGenerico(${idReal}, this.checked)">
              </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="window.editarItemGenerico(${idReal}, '${item.descricao || item.nome || ""}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.abrirModalExcluirGerenciamento(${idReal})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
      });
    } else {
      lista.innerHTML = `<tr><td colspan="4" class="text-center">Nenhum registro encontrado</td></tr>`;
    }
  } catch (err) {
    console.warn("Aviso ao carregar lista modal:", err);
  }
}

window.salvarComposicao = async function () {
  const inputEl = document.getElementById("modalInput");
  if (!inputEl) return;
  const valor = inputEl.value.trim();

  if (!valor) {
    alert("Digite uma descrição válida.");
    return;
  }

  if (!window.contextoAtual) return;

  const baseUrl = window.BASE_URL || '/sistema';
  let url = `${baseUrl}/api/${window.contextoAtual.recurso}`;
  let body = { descricao: valor };

  if (window.editIdGenerico) {
    body._method = "PUT";
    url = `${baseUrl}/api/${window.contextoAtual.recurso}/${window.editIdGenerico}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.erro || "Erro ao salvar");
      return;
    }

    resetModalState();
    carregarListaModal();
    if (typeof window.popularSelects === "function") window.popularSelects();
  } catch (err) {
    console.warn("Erro ao salvar:", err);
  }
};

window.editarItemGenerico = function (id, descricao) {
  window.editIdGenerico = id;
  const inputEl = document.getElementById("modalInput");
  if (inputEl) inputEl.value = descricao;

  const btnSalvar = document.getElementById("btnSalvarComposicao");
  const btnCancelar = document.getElementById("btnCancelarComposicao");
  if (!btnSalvar || !btnCancelar) return;

  btnSalvar.textContent = "Atualizar";
  btnSalvar.classList.remove("btn-primary");
  btnSalvar.classList.add("btn-warning");
  btnCancelar.classList.remove("d-none");
};

window.abrirModalExcluirGerenciamento = function (id) {
  const modalEl = document.getElementById("modalExcluirGerenciamento");
  const btnSim = document.getElementById("btnConfirmarExcluirGerenciamento");

  if (!modalEl || !btnSim) return;

  btnSim.onclick = async () => {
    await window.deletarItemReal(id);
    if (typeof bootstrap !== "undefined") {
      bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    }
  };

  if (typeof bootstrap !== "undefined") {
    new bootstrap.Modal(modalEl).show();
  }
};

window.deletarItemReal = async function (id) {
  try {
    if (!window.contextoAtual) return;
    const baseUrl = window.BASE_URL || '/sistema';
    const response = await fetch(`${baseUrl}/api/${window.contextoAtual.recurso}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _method: "DELETE" }),
    });

    const data = await response.json();
    if (response.ok) {
      if (typeof showToast === "function") showToast("Sucesso", data);
      carregarListaModal();
      if (typeof window.popularSelects === "function") window.popularSelects();
    } else {
      if (typeof showToast === "function") showToast("Impedimento", { erro: data.erro, mensagem: data.mensagem || "Item em uso." });
    }
  } catch (err) {
    console.warn("Erro na requisição:", err);
  }
};

function resetModalState() {
  window.editIdGenerico = null;
  const inputEl = document.getElementById("modalInput");
  if (inputEl) inputEl.value = "";

  const btnSalvar = document.getElementById("btnSalvarComposicao");
  const btnCancelar = document.getElementById("btnCancelarComposicao");
  if (!btnSalvar || !btnCancelar) return;

  btnSalvar.innerHTML = '<i class="fa-solid fa-plus"></i> Cadastrar';
  btnSalvar.classList.remove("btn-warning");
  btnSalvar.classList.add("btn-primary");
  btnCancelar.classList.add("d-none");
}

window.cancelarEdicaoComposicao = function () {
  resetModalState();
};

window.alternarAtivoGenerico = async function (id, isChecked) {
  try {
    if (!window.contextoAtual) return;
    const baseUrl = window.BASE_URL || '/sistema';
    await fetch(`${baseUrl}/api/${window.contextoAtual.recurso}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _method: "PUT", ativo: isChecked ? 1 : 0 }),
    });
  } catch (err) {
    console.warn("Erro ao alternar ativo:", err);
  }
};

window.popularSelects = async function (limparMemoria = false) {
  try {
    await carregarSelect("id_shaperPedido", "shapers", "id_shaper", "nome");
    await carregarSelect("id_composicaoPedido", "composicoes", "id_composicao", "descricao");
    await carregarSelect("id_variacaoPedido", "variacoes", "id_variacao", "descricao");
    await carregarSelect("id_acabamentoPedido", "acabamentos", "id_acabamento", "descricao");
    await carregarSelect("id_tecidoPedido", "tecidos", "id_tecido", "descricao");
    await carregarSelect("id_configuracaoquilhaPedido", "configuracaoquilhas", "id_configuracaoquilha", "descricao");
    await carregarSelect("id_sistemaquilhaPedido", "sistemaquilhas", "id_sistemaquilha", "descricao");
    await carregarSelect("id_cor", "cores", "id_cor", "descricao");

    const elTecido = document.getElementById("id_tecidoPedido");
    if (elTecido && typeof Choices !== "undefined") {
      try {
        if (tecidosChoice) tecidosChoice.destroy();
        tecidosChoice = new Choices(elTecido, { removeItemButton: true, placeholder: true, placeholderValue: "Selecione..." });
      } catch (e) {}
    }

    const elCor = document.getElementById("id_cor");
    if (elCor && typeof Choices !== "undefined") {
      try {
        if (coresChoice) coresChoice.destroy();
        coresChoice = new Choices(elCor, { removeItemButton: true, placeholder: true, placeholderValue: "Selecione..." });
      } catch (e) {}
    }
  } catch (e) {
    console.warn("Aviso ao popular selects:", e);
  }
};

async function carregarSelect(selectId, recurso, idCampo, textoCampo) {
  try {
    const baseUrl = window.BASE_URL || '/sistema';
    const response = await fetch(`${baseUrl}/api/${recurso}?somenteAtivos=1&t=${Date.now()}`);
    if (!response.ok) return;
    const data = await response.json();
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = "";
    if (!select.hasAttribute("multiple")) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Selecione...";
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
    }

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[idCampo] ?? item.id;
        option.textContent = item[textoCampo] ?? item.nome ?? item.descricao;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.warn(`Erro ao carregar select ${selectId}:`, err);
  }
}

window.initPedido = function () {
  if (typeof listarPedidos === "function") listarPedidos();
  window.popularSelects();
};

// Executa a inicialização de forma segura ao carregar o script
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(() => { if (window.initPedido) window.initPedido(); }, 100);
} else {
  document.addEventListener("DOMContentLoaded", () => { if (window.initPedido) window.initPedido(); });
}