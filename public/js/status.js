window.editIdStatus = null;
window.statusCache = {};

function apiStatus(id = null) {
  if (id !== null && id !== undefined && id !== "")
    return `${window.BASE_URL}/api/status/${id}`;
  return `${window.BASE_URL}/api/status`;
}

// Sua tabela usa id_status
function getIdStatus(s) {
  return s.id_status ?? s.id ?? null;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function avisarStatus(tipo, texto) {
  if (typeof showToast === "function") {
    if (tipo === "success") showToast("Sucesso", { mensagem: texto });
    else showToast("Atenção", { erro: texto, mensagem: texto });
  }
  const alerta = document.getElementById("alerta-status");
  if (alerta) {
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = texto;
    clearTimeout(window._alertaStatusTimer);
    window._alertaStatusTimer = setTimeout(() => {
      alerta.className = "alert d-none";
    }, 5000);
  }
}

window.carregarStatus = async function () {
  const container = document.getElementById("conteudo-status");
  const res = await fetch(`${window.BASE_URL}/views/status/index.php`);
  container.innerHTML = await res.text();
  window.listarStatus();
};

window.listarStatus = async function () {
  try {
    const res = await fetch(apiStatus());
    const data = await res.json();
    const lista = document.getElementById("lista-status");
    if (!lista) return;

    const buscar = document.getElementById("buscarStatus");
    if (buscar) buscar.value = "";

    lista.innerHTML = "";
    window.statusCache = {};

    data.forEach((s) => {
      const id = getIdStatus(s);
      window.statusCache[id] = { ...s, id };

      const tr = document.createElement("tr");
      tr.setAttribute("data-id", id);
      tr.setAttribute("draggable", "true");
      tr.innerHTML = `
        <td class="reorder-handle text-center" style="cursor: grab;">
          <i class="fa-solid fa-grip-vertical text-muted"></i>
        </td>
        <td>${escapeHtml(s.descricao)}</td>
        <td class="text-center">
          <div class="form-check form-switch d-inline-block">
            <input class="form-check-input" type="checkbox" role="switch"
              ${s.ativo == 1 ? "checked" : ""}
              onchange="window.alternarAtivoStatus(${id}, this.checked)">
          </div>
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-secondary" title="Editar"
              onclick="window.editarStatus(${id})">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn btn-outline-danger" title="Excluir"
              onclick="window.abrirModalStatusExcluir(${id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
        <td class="col-ordem d-none">${s.ordem ?? ""}</td>
      `;
      lista.appendChild(tr);
    });

    if (typeof Sortable !== "undefined") {
      const oldSortable = Sortable.get(lista);
      if (oldSortable) oldSortable.destroy();
      new Sortable(lista, {
        animation: 150,
        handle: ".reorder-handle",
        draggable: "tr",
        delay: 100,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        direction: "vertical",
        onEnd: async function () {
          await window.salvarNovaOrdemStatus();
        },
      });
    }
  } catch (error) {
    console.error("Erro ao listar:", error);
    avisarStatus("danger", "Erro ao carregar a lista de status.");
  }
};

// ===============================
// EXCLUSÃO
// ===============================
window.abrirModalStatusExcluir = function (id) {
  const modalElement = document.getElementById("modalStatusExcluirBase");
  const btnConfirmar = document.getElementById("btnConfirmarExcluirStatus");

  if (!modalElement || !btnConfirmar) {
    console.error("Modal de exclusão não encontrado no DOM.");
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  // Tira o foco antes de esconder (evita o aviso de aria-hidden)
  modalElement.addEventListener(
    "hide.bs.modal",
    () => {
      if (document.activeElement) document.activeElement.blur();
    },
    { once: true },
  );

  btnConfirmar.onclick = async () => {
    btnConfirmar.disabled = true;
    await window.deletarStatus(id);
    modal.hide();
    btnConfirmar.disabled = false;
  };

  modal.show();
};

window.deletarStatus = async function (id) {
  if (!id) {
    console.error("deletarStatus chamado sem ID:", id);
    avisarStatus("danger", "ID do status não informado.");
    return;
  }

  try {
    const res = await fetch(apiStatus(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _method: "DELETE", id: id }),
    });

    const result = await res.json().catch(() => ({}));

    if (res.ok) {
      avisarStatus("success", result.mensagem || "Status excluído com sucesso.");
      window.listarStatus();
    } else {
      avisarStatus(
        "warning",
        result.mensagem || result.erro || "Não foi possível excluir.",
      );
    }
  } catch (error) {
    console.error("Erro na comunicação:", error);
    avisarStatus("danger", "Falha na comunicação com o servidor.");
  }
};

// ===============================
// ATIVO / ORDEM
// ===============================
window.alternarAtivoStatus = async function (id, isChecked) {
  try {
    const res = await fetch(apiStatus(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _method: "PUT",
        id: id,
        ativo: isChecked ? 1 : 0,
        somenteAtivo: true,
      }),
    });
    if (!res.ok) {
      avisarStatus("warning", "Não foi possível alterar o status.");
      window.listarStatus();
    }
  } catch (error) {
    console.error(error);
    window.listarStatus();
  }
};

window.salvarNovaOrdemStatus = async function () {
  const ordens = Array.from(document.querySelectorAll("#lista-status tr")).map(
    (linha, i) => {
      const id = linha.getAttribute("data-id");
      const colOrdem = linha.querySelector(".col-ordem");
      if (colOrdem) colOrdem.innerText = i + 1;
      return { id, ordem: i + 1 };
    },
  );
  await fetch(apiStatus(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordens }),
  });
};

// ===============================
// CADASTRO / EDIÇÃO
// ===============================
window.salvarCadastroStatus = async function () {
  const descricao = document.getElementById("descricao").value.trim();

  if (!descricao) {
    avisarStatus("warning", "Preencha a descrição.");
    return;
  }

  const body = { descricao, id: window.editIdStatus };

  if (window.editIdStatus) {
    body._method = "PUT";
    body.ordem = document.getElementById("ordem").value;
  } else {
    body.ordem = document.querySelectorAll("#lista-status tr").length + 1;
  }

  try {
    const res = await fetch(apiStatus(window.editIdStatus), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const editando = !!window.editIdStatus;
      window.cancelarEdicaoStatus();
      window.listarStatus();
      avisarStatus(
        "success",
        editando ? "Status atualizado com sucesso." : "Status cadastrado com sucesso.",
      );
    } else {
      const result = await res.json().catch(() => ({}));
      avisarStatus("warning", result.mensagem || result.erro || "Erro ao salvar.");
    }
  } catch (error) {
    console.error(error);
    avisarStatus("danger", "Falha na comunicação com o servidor.");
  }
};

window.editarStatus = function (id) {
  const s = window.statusCache[id];
  if (!s) return;

  window.editIdStatus = id;
  document.getElementById("descricao").value = s.descricao;
  document.getElementById("ordem").value = s.ordem ?? "";

  const btn = document.getElementById("btnSubmitStatus");
  btn.innerHTML = '<i class="fa-solid fa-save"></i> Atualizar';
  btn.classList.replace("btn-primary", "btn-success");

  document.getElementById("btnCancelarEdicao").classList.remove("d-none");
  document.getElementById("descricao").focus();
};

window.cancelarEdicaoStatus = function () {
  window.editIdStatus = null;
  document.getElementById("descricao").value = "";
  document.getElementById("ordem").value = "";

  const btn = document.getElementById("btnSubmitStatus");
  btn.innerHTML = '<i class="fa-solid fa-plus"></i> Cadastrar';
  btn.classList.replace("btn-success", "btn-primary");

  document.getElementById("btnCancelarEdicao").classList.add("d-none");
};

// ===============================
// BUSCA
// ===============================
window.buscarStatus = function () {
  const termo = document.getElementById("buscarStatus").value.toLowerCase();
  document.querySelectorAll("#lista-status tr").forEach((linha) => {
    linha.style.display = linha.textContent.toLowerCase().includes(termo) ? "" : "none";
  });
};

window.limparBuscaStatus = function () {
  document.getElementById("buscarStatus").value = "";
  document.querySelectorAll("#lista-status tr").forEach((linha) => {
    linha.style.display = "";
  });
};