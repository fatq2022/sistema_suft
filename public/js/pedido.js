// Variáveis globais

window.colunaOrdenacaoAtual =
  localStorage.getItem("pedido_ordem_coluna") || "id_pedido";
window.ordemAscendente = localStorage.getItem("pedido_ordem_dir") === "true";
window.dadosPedidosAtuais = [];

function obterTextoStatus(p) {
  if (!p.status || !p.status_ids) return "Sem Status";
  const nomes = p.status.split(",");
  const ids = p.status_ids.split(",");
  let maxId = -1;
  let idx = 0;
  ids.forEach((id, i) => {
    const n = parseInt(id.trim());
    if (n > maxId) {
      maxId = n;
      idx = i;
    }
  });
  return nomes[idx].trim();
}

// Função global para extrair o status mais recente baseada no maior ID
window.getUltimoStatusValue = function (p) {
  if (!p.status || !p.status_ids) return "Sem Status";

  const nomes = p.status.split(",");
  const ids = p.status_ids.split(",");

  let maxId = -1;
  let indiceMaisRecente = 0;

  ids.forEach((idStr, index) => {
    const idNum = parseInt(idStr.trim());
    if (idNum > maxId) {
      maxId = idNum;
      indiceMaisRecente = index;
    }
  });
  console.log(nomes);
  return nomes[indiceMaisRecente]
    ? nomes[indiceMaisRecente].trim()
    : "Sem Status";
};

if (window.PEDIDO_MODULE_LOADED) {
  console.warn("pedido.js já carregado");
} else {
  window.PEDIDO_MODULE_LOADED = true;

  // ===============================
  // CONTROLE GLOBAL
  // ===============================
  let contextoAtual = null;
  let editIdGenerico = null;

  // ===============================
  // CONFIG DOS CAMPOS
  // ===============================
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

  // ===============================
  // ABRIR MODAL
  // ===============================
  window.abrirModalGenerico = function (tipo) {
    contextoAtual = modalConfigs[tipo];
    editIdGenerico = null;

    if (!contextoAtual) return;

    document.querySelector("#modalGenerico .modal-title").innerHTML =
      contextoAtual.icon + " " + contextoAtual.titulo;

    const input = document.getElementById("modalInput");
    input.value = "";
    input.placeholder = contextoAtual.label;

    resetModalState();
    carregarListaModal();

    const modal = new bootstrap.Modal(document.getElementById("modalGenerico"));
    modal.show();
  };

  // ===============================
  // LISTAR
  // ===============================
  async function carregarListaModal() {
    if (!contextoAtual) return;

    const response = await fetch(`${BASE_URL}/api/${contextoAtual.recurso}`);
    const data = await response.json();

    const lista = document.getElementById("listaComposicoesModal");
    lista.innerHTML = "";

    data.forEach((item) => {
      const idReal =
        item.id ||
        item.id_composicao ||
        item.id_variacao ||
        item.id_acabamento ||
        item.id_configuracaoquilha ||
        item.id_sistemaquilha ||
        item.id_cor ||
        item.id_tecido;

      lista.innerHTML += `
    <tr>
        <td>${idReal}</td>
        <td>${item.descricao}</td>
        <td class="text-center align-middle">
          <div class="form-check form-switch d-inline-block">
            <input class="form-check-input" type="checkbox" role="switch" 
              ${item.ativo == 1 ? "checked" : ""}
            onchange="window.alternarAtivoGenerico(${idReal}, this.checked)">
          </div>
        </td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" onclick="window.editarItem(${idReal}, '${item.descricao}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="window.abrirModalExcluirGerenciamento(${idReal})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>`;
    });
  }

  // ===============================
  // SALVAR / EDITAR
  // ===============================
  window.salvarComposicao = async function () {
    const valor = document.getElementById("modalInput").value.trim();

    if (!valor) {
      alert("Digite algo");
      return;
    }

    let url = `${BASE_URL}/api/${contextoAtual.recurso}`;
    let body = { descricao: valor };

    if (editIdGenerico) {
      body._method = "PUT";
      url = `${BASE_URL}/api/${contextoAtual.recurso}/${editIdGenerico}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.erro);
      return;
    }

    resetModalState();
    carregarListaModal();
    if (typeof popularSelects === "function") popularSelects();
  };

  // ===============================
  // EDITAR
  // ===============================
  window.editarItem = function (id, descricao) {
    editIdGenerico = id;

    document.getElementById("modalInput").value = descricao;

    const btnSalvar = document.getElementById("btnSalvarComposicao");
    const btnCancelar = document.getElementById("btnCancelarComposicao");

    btnSalvar.textContent = "Editar";
    btnSalvar.classList.remove("btn-primary");
    btnSalvar.classList.add("btn-warning");

    btnCancelar.classList.remove("d-none");
  };

  // ===============================
  // EXCLUIR
  // ===============================
  window.abrirModalExcluirGerenciamento = function (id) {
    const modalEl = document.getElementById("modalExcluirGerenciamento");
    const btnSim = document.getElementById("btnConfirmarExcluirGerenciamento");

    if (!modalEl) return console.error("Modal de exclusão não encontrado!");

    btnSim.onclick = async () => {
      await window.deletarItemReal(id);
      bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    };

    let inst = bootstrap.Modal.getInstance(modalEl);
    if (inst) inst.dispose();
    new bootstrap.Modal(modalEl).show();
  };

  window.deletarItemReal = async function (id) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/${contextoAtual.recurso}/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _method: "DELETE" }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        showToast("Sucesso", data);
        carregarListaModal();
        if (typeof popularSelects === "function") popularSelects();
      } else {
        showToast("Impedimento", {
          erro: data.erro,
          mensagem: data.mensagem || "Este item está em uso.",
        });
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
    }
  };

  // ===============================
  // RESET
  // ===============================
  function resetModalState() {
    editIdGenerico = null;

    document.getElementById("modalInput").value = "";

    const btnSalvar = document.getElementById("btnSalvarComposicao");
    const btnCancelar = document.getElementById("btnCancelarComposicao");

    btnSalvar.innerHTML = '<i class="fa-solid fa-plus"></i> Cadastrar';
    btnSalvar.classList.remove("btn-warning");
    btnSalvar.classList.add("btn-primary");

    btnCancelar.classList.add("d-none");
  }

  window.cancelarEdicaoComposicao = function () {
    resetModalState();
  };

  // ===============================
  // ABRIR PEDIDO
  // ===============================
  window.abrirPedido = async function () {
    if (typeof carregarPedido === "function") {
      window.pedidoCarregado = false;
      await carregarPedido();
      if (typeof listarPedidos === "function") {
        listarPedidos();
      }
    }
  };

  // ===============================
  // ABRIR SHAPER
  // ===============================
  window.abrirShaper = async function () {
    if (typeof carregarShaper === "function") {
      window.shaperCarregado = false;
      await carregarShaper();
      if (typeof listarShapers === "function") {
        listarShapers();
      }
    }

    const triggerEl = document.querySelector('[data-bs-target="#shaper"]');
    if (triggerEl) {
      const tab = new bootstrap.Tab(triggerEl);
      tab.show();
    }
  };

  document.addEventListener("input", function (e) {
    if (e.target.classList.contains("is-invalid")) {
      e.target.classList.remove("is-invalid");
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.classList.contains("is-invalid")) {
      e.target.classList.remove("is-invalid");
    }
  });

  window.editIdPedido = null;

  let tecidosChoice;
  let coresChoice;

  window.apiUrlPedido = function (recurso, id = null) {
    if (id) return `${window.BASE_URL}/api/${recurso}/${id}`;
    return `${window.BASE_URL}/api/${recurso}`;
  };

  function mostrarAlertaPedido(msg, tipo = "success") {
    const alerta = document.getElementById("alertaPedido");
    alerta.className = `alert alert-${tipo}`;
    alerta.innerHTML = msg;
    alerta.classList.remove("d-none");
    setTimeout(() => alerta.classList.add("d-none"), 4000);
  }

  window.popularSelects = async function (limparMemoria = false) {
    const memoria = limparMemoria
      ? {}
      : {
          data: document.getElementById("dataPedido")?.value,
          tipo_bloco: document.getElementById("tipo_blocoPedido")?.value,
          obs: document.getElementById("observacaoPedido")?.value,
          shaper: document.getElementById("id_shaperPedido")?.value,
          composicao: document.getElementById("id_composicaoPedido")?.value,
          variacao: document.getElementById("id_variacaoPedido")?.value,
          acabamento: document.getElementById("id_acabamentoPedido")?.value,
          quilha: document.getElementById("id_configuracaoquilhaPedido")?.value,
          sistema: document.getElementById("id_sistemaquilhaPedido")?.value,
          cores:
            typeof coresChoice !== "undefined"
              ? coresChoice.getValue(true)
              : [],
          tecidos:
            typeof tecidosChoice !== "undefined"
              ? tecidosChoice.getValue(true)
              : [],
        };

    await carregarSelect("id_shaperPedido", "shapers", "id_shaper", "nome");
    await carregarSelect("id_composicaoPedido", "composicoes", "id_composicao", "descricao");
    await carregarSelect("id_variacaoPedido", "variacoes", "id_variacao", "descricao");
    await carregarSelect("id_acabamentoPedido", "acabamentos", "id_acabamento", "descricao");
    await carregarSelect("id_tecidoPedido", "tecidos", "id_tecido", "descricao");
    await carregarSelect("id_configuracaoquilhaPedido", "configuracaoquilhas", "id_configuracaoquilha", "descricao");
    await carregarSelect("id_sistemaquilhaPedido", "sistemaquilhas", "id_sistemaquilha", "descricao");
    await carregarSelect("id_cor", "cores", "id_cor", "descricao");

    if (tecidosChoice) tecidosChoice.destroy();
    tecidosChoice = new Choices("#id_tecidoPedido", {
      removeItemButton: true,
      placeholder: true,
      placeholderValue: "Selecione...",
    });

    if (coresChoice) coresChoice.destroy();
    coresChoice = new Choices("#id_cor", {
      removeItemButton: true,
      placeholder: true,
      placeholderValue: "Selecione...",
    });

    if (!limparMemoria) {
      if (memoria.data) document.getElementById("dataPedido").value = memoria.data;
      if (memoria.tipo_bloco) document.getElementById("tipo_blocoPedido").value = memoria.tipo_bloco;
      if (memoria.obs) document.getElementById("observacaoPedido").value = memoria.obs;
      if (memoria.shaper) document.getElementById("id_shaperPedido").value = memoria.shaper;
      if (memoria.composicao) document.getElementById("id_composicaoPedido").value = memoria.composicao;
      if (memoria.variacao) document.getElementById("id_variacaoPedido").value = memoria.variacao;
      if (memoria.acabamento) document.getElementById("id_acabamentoPedido").value = memoria.acabamento;
      if (memoria.quilha) document.getElementById("id_configuracaoquilhaPedido").value = memoria.quilha;
      if (memoria.sistema) document.getElementById("id_sistemaquilhaPedido").value = memoria.sistema;
      if (memoria.cores?.length > 0) coresChoice.setChoiceByValue(memoria.cores);
      if (memoria.tecidos?.length > 0) tecidosChoice.setChoiceByValue(memoria.tecidos);
    }
  };

  async function carregarSelect(selectId, recurso, idCampo, textoCampo) {
    const response = await fetch(
      `${apiUrlPedido(recurso)}?somenteAtivos=1&t=${Date.now()}`,
    );
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

    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[idCampo] ?? item.id;
      option.textContent = item[textoCampo] ?? item.nome ?? item.descricao;
      select.appendChild(option);
    });
  }

  window.listarPedidos = async function (
    coluna = window.colunaOrdenacaoAtual,
    inverter = true,
  ) {
    if (arguments.length === 0 || window.dadosPedidosAtuais.length === 0) {
      window.dadosPedidosAtuais = [];
    }

    if (window.dadosPedidosAtuais.length === 0) {
      const response = await fetch(apiUrlPedido("pedidos"));
      window.dadosPedidosAtuais = await response.json();
    }

    if (inverter) {
      window.ordemAscendente = !window.ordemAscendente;
    }

    window.dadosPedidosAtuais.sort((a, b) => {
      let valA = coluna === "status" ? obterTextoStatus(a) : a[coluna] || "";
      let valB = coluna === "status" ? obterTextoStatus(b) : b[coluna] || "";

      if (coluna === "id_pedido") {
        return window.ordemAscendente ? valA - valB : valB - valA;
      }
      return window.ordemAscendente
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

    localStorage.setItem("pedido_ordem_coluna", coluna);
    localStorage.setItem("pedido_ordem_dir", window.ordemAscendente);
    window.colunaOrdenacaoAtual = coluna;

    const lista = document.getElementById("listaPedidos");
    if (!lista) return;
    lista.innerHTML = "";

    window.dadosPedidosAtuais.forEach((pedido) => {
      const nomeStatus = obterTextoStatus(pedido);
      const badgeClass =
        nomeStatus === "Sem Status" ? "bg-secondary" : "bg-primary";
      
      lista.innerHTML += `
            <tr>
                <td>${pedido.id_pedido}</td>
                <td><span class="badge ${badgeClass}">${nomeStatus}</span></td>
                <td>${window.formatarDataBR(pedido.data)}</td>
                <td>${pedido.shaper}</td>
                <td class="small text-muted">${pedido.observacao ?? ""}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-secondary" onclick="window.abrirModalPedidoDetalhe(${pedido.id_pedido})"><i class="fa-solid fa-ellipsis"></i></button>
                        <button class="btn btn-outline-secondary" onclick="preencherEdicaoPedido(${pedido.id_pedido})"><i class="fa-solid fa-file-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.abrirModalDeletarPedido(${pedido.id_pedido})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    });
  };

  window.cadastrarOuAtualizarPedido = async function () {
    const camposObrigatorios = [
      { id: "dataPedido", nome: "Data" },
      { id: "tipo_blocoPedido", nome: "Tipo de Bloco" },
      { id: "id_shaperPedido", nome: "Shaper" },
      { id: "id_composicaoPedido", nome: "Composição" },
      { id: "id_variacaoPedido", nome: "Variação" },
      { id: "id_acabamentoPedido", nome: "Acabamento" },
      { id: "id_configuracaoquilhaPedido", nome: "Config. Quilha" },
      { id: "id_sistemaquilhaPedido", nome: "Sistema Quilha" },
    ];

    let camposFaltando = [];
    camposObrigatorios.forEach((campo) => {
      const el = document.getElementById(campo.id);
      if (!el || !el.value) {
        camposFaltando.push(" " + campo.nome);
      }
    });

    const cores = coresChoice.getValue(true);
    const tecidos = tecidosChoice.getValue(true);

    if (cores.length === 0) camposFaltando.push(" Cores");
    if (tecidos.length === 0) camposFaltando.push(" Tecido");

    if (camposFaltando.length > 0) {
      if (typeof showToast === "function") {
        showToast("Pedido", {
          erro: `Preencha todos os campos: ${camposFaltando}`,
        });
      }
      return;
    }

    const bodyData = {
      data: document.getElementById("dataPedido").value,
      tipo_bloco: document.getElementById("tipo_blocoPedido").value,
      id_shaper: document.getElementById("id_shaperPedido").value,
      id_composicao: document.getElementById("id_composicaoPedido").value,
      id_variacao: document.getElementById("id_variacaoPedido").value,
      id_acabamento: document.getElementById("id_acabamentoPedido").value,
      id_configuracaoquilha: document.getElementById("id_configuracaoquilhaPedido").value,
      id_sistemaquilha: document.getElementById("id_sistemaquilhaPedido").value,
      observacao: document.getElementById("observacaoPedido").value,
      tecidos: tecidos,
      cores: cores,
    };

    let url = apiUrlPedido("pedidos");
    if (window.editIdPedido) {
      bodyData._method = "PUT";
      url = apiUrlPedido("pedidos", window.editIdPedido);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        if (typeof showToast === "function") showToast("Pedido", data);

        window.dadosPedidosAtuais = [];

        if (typeof resetFormPedido === "function") {
          window.resetFormPedido();
        }

        if (window.listarPedidos) {
          window.listarPedidos(window.colunaOrdenacaoAtual, false);
        }
      } else {
        if (typeof showToast === "function") {
          showToast("Erro", { erro: data.erro || "Erro ao salvar o pedido" });
        }
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      if (typeof showToast === "function") {
        showToast("Erro", { erro: "Falha de comunicação com o servidor." });
      }
    }
  };

  window.preencherEdicaoPedido = async function (id) {
    const response = await fetch(apiUrlPedido("pedidos", id));
    const pedido = await response.json();
    window.editIdPedido = pedido.id_pedido;

    const garantirValorNoSelect = (selectId, valorId, textoExibicao) => {
      const select = document.getElementById(selectId);
      if (!select) return;

      const existe = Array.from(select.options).some(
        (opt) => opt.value == valorId,
      );

      if (!existe && valorId) {
        const opt = document.createElement("option");
        opt.value = valorId;
        opt.textContent = textoExibicao + " (Inativo)";
        select.appendChild(opt);
      }
      select.value = valorId;
    };

    document.getElementById("dataPedido").value = pedido.data;
    document.getElementById("tipo_blocoPedido").value = pedido.tipo_bloco || "PU";
    document.getElementById("observacaoPedido").value = pedido.observacao;

    garantirValorNoSelect("id_shaperPedido", pedido.id_shaper, pedido.shaper);
    garantirValorNoSelect("id_composicaoPedido", pedido.id_composicao, pedido.composicao);
    garantirValorNoSelect("id_variacaoPedido", pedido.id_variacao, pedido.variacao);
    garantirValorNoSelect("id_acabamentoPedido", pedido.id_acabamento, pedido.acabamento);
    garantirValorNoSelect("id_configuracaoquilhaPedido", pedido.id_configuracaoquilha, pedido.configuracaoquilha);
    garantirValorNoSelect("id_sistemaquilhaPedido", pedido.id_sistemaquilha, pedido.sistemaquilha);

    tecidosChoice.removeActiveItems();
    coresChoice.removeActiveItems();
    if (pedido.tecidos_ids) {
      const tecidos = pedido.tecidos_ids.split(",");
      tecidosChoice.setChoiceByValue(tecidos);
    }
    if (pedido.cores_ids) {
      const cores = pedido.cores_ids.split(",");
      coresChoice.setChoiceByValue(cores);
    }

    const btnSubmit = document.getElementById("btnSubmitPedido");
    btnSubmit.textContent = "Atualizar";
    btnSubmit.classList.remove("btn-primary");
    btnSubmit.classList.add("btn-warning");

    document.getElementById("btnCancelarPedido").classList.remove("d-none");
    document.getElementById("up")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.cancelarEdicaoPedido = function () {
    resetFormPedido();
  };

  window.abrirModalDeletarPedido = function (id) {
    const modalEl = document.getElementById("modalPedidoExcluir");
    const btnConfirmar = document.getElementById("btnConfirmarDeletarPedido");

    btnConfirmar.onclick = async () => {
      await window.deletarPedido(id);
      bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  };

  window.deletarPedido = async function (id) {
    try {
      const response = await fetch(apiUrlPedido("pedidos", id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _method: "DELETE" }),
      });

      const data = await response.json();

      if (response.ok) {
        dadosPedidosAtuais = [];
        if (typeof showToast === "function") showToast("Pedido", data);
        listarPedidos();
      } else {
        if (typeof showToast === "function") showToast("Erro", data);
      }
    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
    }
  };

  window.resetFormPedido = function () {
    window.editIdPedido = null;

    document.getElementById("dataPedido").value = "";
    document.getElementById("tipo_blocoPedido").value = "PU";
    document.getElementById("observacaoPedido").value = "";

    const btnSubmit = document.getElementById("btnSubmitPedido");
    btnSubmit.classList.replace("btn-warning", "btn-primary");
    btnSubmit.textContent = "Cadastrar";
    document.getElementById("btnCancelarPedido").classList.add("d-none");

    if (window.popularSelects) {
      window.popularSelects(true);
    }
  };

  window.initPedido = function () {
    if (!document.getElementById("listaPedidos")) return;
    listarPedidos();
    if (typeof listarPedidosStatus === "function") listarPedidosStatus();
    popularSelects();
  };

  let pedidoJaCarregado = false;

  document.addEventListener("shown.bs.tab", function (e) {
    const target = e.target.getAttribute("data-bs-target");

    if (target === "#tabGerenciamentoPedido" && !pedidoJaCarregado) {
      pedidoJaCarregado = true;
      initPedido();
    }
  });
}

window.carregarShapersPedido = async function () {
  const select = document.getElementById("id_shaperPedido");
  if (!select) return;

  try {
    const res = await fetch(
      `${window.BASE_URL}/api/shapers?ativos=true&t=${Date.now()}`,
    );
    const shapers = await res.json();

    select.innerHTML = '<option value="">Selecione...</option>';
    shapers.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.nome;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Erro ao carregar shapers:", e);
  }
};

window.abrirModalPedidoDetalhe = async function (id) {
  const modalEl = document.getElementById("modalPedidoDetalhe");
  const corpoModal = modalEl.querySelector(".modal-body");
  const tituloModal = modalEl.querySelector(".modal-title");

  tituloModal.innerHTML = `<i class="fa-solid fa-file-invoice"></i> Detalhes do Pedido #${id}`;
  corpoModal.innerHTML =
    '<div class="text-center p-3"><div class="spinner-border spinner-border-sm"></div> Carregando...</div>';

  bootstrap.Modal.getOrCreateInstance(modalEl).show();

  try {
    const response = await fetch(apiUrlPedido("pedidos", id));
    const p = await response.json();

    const responsepe = await fetch(apiUrlPedido("pedidos-status", id));
    const ppe = await responsepe.json();

    let statusTexto = "Sem Status";
    if (Array.isArray(ppe) && ppe.length > 0) {
      statusTexto = ppe[0].descricao;
    }

    corpoModal.innerHTML = `
            <div class="row g-2">
                <div class="col-6"><strong>Data:</strong><br> ${window.formatarDataBR(p.data)}</div>
                <div class="col-6"><strong>Tipo de Bloco:</strong><br> <span class="badge bg-secondary">${p.tipo_bloco || "PU"}</span></div>
                <div class="col-6 mt-2"><strong>Status Atual:</strong><br> 
                    <span class="badge bg-primary text-uppercase">${statusTexto}</span>
                </div>
                
                <div class="col-12 mt-2"><strong>Shaper / Cliente:</strong><br> ${p.shaper}</div>
                
                <hr class="my-2">
                
                <div class="col-6"><strong>Composição:</strong><br> ${p.composicao || "-"}</div>
                <div class="col-6"><strong>Variação:</strong><br> ${p.variacao || "-"}</div>
                <div class="col-6"><strong>Acabamento:</strong><br> ${p.acabamento || "-"}</div>
                <div class="col-6"><strong>Config. Quilha:</strong><br> ${p.configuracaoquilha || "-"}</div>
                <div class="col-6"><strong>Sistema Quilha:</strong><br> ${p.sistemaquilha || "-"}</div>
                
                <hr class="my-2">
                
                <div class="col-12"><strong>Cores:</strong><br> ${p.cores || "-"}</div>
                <div class="col-12"><strong>Tecidos:</strong><br> ${p.tecidos || "-"}</div>
                
                <div class="col-12 mt-2">
                    <strong>Observação:</strong><br>
                    <p class="text-muted small">${p.observacao || "Sem observações."}</p>
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Erro ao carregar detalhes:", error);
    corpoModal.innerHTML =
      '<div class="alert alert-danger">Erro ao carregar detalhes.</div>';
  }
};

window.alternarAtivoGenerico = async function (id, isChecked) {
  try {
    let recurso = typeof contextoAtual !== "undefined" && contextoAtual ? contextoAtual.recurso : null;
    if (!recurso) return;

    const response = await fetch(`${BASE_URL}/api/${recurso}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _method: "PUT", ativo: isChecked ? 1 : 0 }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.erro || "Erro ao alterar estado.");
    }
  } catch (err) {
    console.error("Erro:", err);
  }
};