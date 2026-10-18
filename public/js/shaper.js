// shaper.js
if (!window.SHAPER_MODULE_LOADED) {
  window.SHAPER_MODULE_LOADED = true;
  window.editId = null;

  function apiUrl(recurso, id = null) {
    const baseUrl = window.BASE_URL || '/sistema';
    if (id) return `${baseUrl}/api/${recurso}/${id}`;
    return `${baseUrl}/api/${recurso}`;
  }

  // ===============================
  // LISTAR SHAPERS
  // ===============================
  window.listarShapers = async function () {
    try {
      const response = await fetch(`${apiUrl("shapers")}?t=${Date.now()}`);
      if (!response.ok) return;
      const data = await response.json();
      const lista = document.getElementById("lista");
      if (!lista) return;

      lista.innerHTML = "";
      if (!data || data.length === 0) {
        lista.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum registro encontrado</td></tr>`;
        return;
      }

      data.forEach((shaper) => {
        const idReal = shaper.id_shaper || shaper.id;

        lista.innerHTML += `
                <tr>
                    <td>${idReal}</td>
                    <td>${shaper.nome}</td>
                    <td>${shaper.telefone || ""}</td>
                    <td>${shaper.email || ""}</td>
                    <td class="text-center align-middle">
                        <div class="form-check form-switch d-inline-block">
                            <input class="form-check-input" type="checkbox" role="switch" 
                                ${shaper.ativo == 1 ? "checked" : ""} 
                                onchange="window.alternarAtivoShaper(${idReal}, this.checked)">
                        </div>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" onclick='window.preencherEdicao(${JSON.stringify(shaper)})' title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="window.abrirModalShaperExcluir(${idReal})" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
      });
    } catch (error) {
      console.error("Erro ao listar shapers:", error);
    }
  };

  // ===============================
  // GESTÃO DO MODAL DE EXCLUSÃO
  // ===============================
  window.abrirModalShaperExcluir = function (id) {
    const modalElement = document.getElementById("modalShaperExcluir");
    if (!modalElement) {
      console.error("Modal #modalShaperExcluir não encontrado!");
      return;
    }

    const btnConfirmar = document.getElementById("btnConfirmarExcluirShaper");
    if (btnConfirmar) {
      btnConfirmar.onclick = async () => {
        await window.deletarShaper(id);
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.hide();
      };
    }

    const instance = bootstrap.Modal.getOrCreateInstance(modalElement);
    instance.show();
  };

  // ===============================
  // AÇÃO DE DELETAR
  // ===============================
  window.deletarShaper = async function (id) {
    try {
      const response = await fetch(apiUrl("shapers", id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _method: "DELETE" }),
      });

      const result = await response.json();

      if (response.ok) {
        if (typeof showToast === "function")
          showToast("Sucesso", {
            mensagem: result.mensagem || "Excluído com sucesso",
          });
        window.listarShapers();
      } else {
        if (typeof showToast === "function") {
          showToast("Atenção", {
            erro: result.erro || "Ação Impedida",
            mensagem:
              result.mensagem ||
              "Não é possível excluir um Shaper em uso. Utilize a opção de desativar.",
          });
        }
      }
    } catch (error) {
      if (typeof showToast === "function") {
        showToast("Atenção", {
          erro: "Erro técnico",
          mensagem:
            "Não é possível excluir um Shaper em uso. Este Shaper possui vínculos com pedidos existentes. Para ocultá-lo, utilize a opção de desativar.",
        });
      }
    }
  };

  // ===============================
  // ALTERNAR ATIVO (SWITCH) - CORRIGIDO
  // ===============================
  window.alternarAtivoShaper = async function (id, isChecked) {
    try {
      const response = await fetch(apiUrl("shapers", id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _method: "PUT",
          ativo: isChecked ? 1 : 0
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        console.error("Erro ao alternar status:", result);
        if (typeof showToast === "function") {
          showToast("Atenção", { erro: "Erro", mensagem: result.mensagem || "Não foi possível atualizar o estado." });
        }
      }
    } catch (error) {
      console.error("Erro de rede ao alternar status:", error);
    }
  };

  // ===============================
  // CADASTRAR / ATUALIZAR
  // ===============================
  window.cadastrarOuAtualizar = async function () {
    const nome = document.getElementById("nome")?.value;
    const telefone = document.getElementById("telefone")?.value;
    const email = document.getElementById("email")?.value;

    if (!nome) {
      if (typeof showToast === "function")
        showToast("Atenção", { erro: "O nome é obrigatório" });
      return;
    }

    let bodyData = { nome, telefone, email };
    let url = apiUrl("shapers");

    if (window.editId) {
      bodyData._method = "PUT";
      url = apiUrl("shapers", window.editId);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const result = await response.json();

      if (response.ok) {
        if (typeof showToast === "function") showToast("Shaper", result);
        window.resetForm();
        window.listarShapers();
      } else {
        if (typeof showToast === "function") showToast("Erro", result);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  // ===============================
  // BUSCAR
  // ===============================
  window.buscarShaper = async function () {
    const texto = document.getElementById("buscarTexto")?.value.trim();
    if (!texto) return window.listarShapers();
    try {
      const response = await fetch(apiUrl("shapers", texto));
      const data = await response.json();
      const lista = document.getElementById("lista");
      if (!lista) return;
      lista.innerHTML = "";
      const results = Array.isArray(data) ? data : [data];
      results.forEach((shaper) => {
        const idReal = shaper.id_shaper || shaper.id;
        lista.innerHTML += `
                <tr>
                    <td>${idReal}</td><td>${shaper.nome}</td><td>${shaper.telefone || ""}</td><td>${shaper.email || ""}</td>
                    <td class="text-center align-middle">
                        <div class="form-check form-switch d-inline-block">
                            <input class="form-check-input" type="checkbox" ${shaper.ativo == 1 ? "checked" : ""} onchange="window.alternarAtivoShaper(${idReal}, this.checked)">
                        </div>
                    </td>
                    <td><div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick='window.preencherEdicao(${JSON.stringify(shaper)})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-outline-danger" onclick="window.abrirModalShaperExcluir(${idReal})"><i class="fa-solid fa-trash"></i></button>
                    </div></td>
                </tr>`;
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ===============================
  // AUXILIARES (EDIÇÃO E RESET)
  // ===============================
  window.preencherEdicao = function (shaper) {
    window.editId = shaper.id_shaper || shaper.id;
    if (document.getElementById("nome")) document.getElementById("nome").value = shaper.nome || "";
    if (document.getElementById("telefone")) document.getElementById("telefone").value = shaper.telefone || "";
    if (document.getElementById("email")) document.getElementById("email").value = shaper.email || "";

    const btnSubmit = document.getElementById("btnSubmit");
    if (btnSubmit) {
      btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Atualizar';
      btnSubmit.classList.replace("btn-primary", "btn-success");
    }

    const btnCancel = document.getElementById("btnCancelarShaper");
    if (btnCancel) btnCancel.classList.remove("d-none");

    if (document.getElementById("nome")) document.getElementById("nome").focus();
    const upEl = document.getElementById("up");
    if (upEl) {
      upEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  window.resetForm = function () {
    window.editId = null;
    if (document.getElementById("nome")) document.getElementById("nome").value = "";
    if (document.getElementById("telefone")) document.getElementById("telefone").value = "";
    if (document.getElementById("email")) document.getElementById("email").value = "";

    const btnSubmit = document.getElementById("btnSubmit");
    if (btnSubmit) {
      btnSubmit.innerHTML = '<i class="fa-solid fa-plus"></i> Cadastrar';
      btnSubmit.classList.replace("btn-success", "btn-primary");
    }

    const btnCancel = document.getElementById("btnCancelarShaper");
    if (btnCancel) btnCancel.classList.add("d-none");
  };

  window.listarShapers();
}