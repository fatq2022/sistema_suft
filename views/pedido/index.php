<div class="container-fluid">

    <h4 class="mb-4"><i class="fa-solid fa-box"></i> Pedido</h4>

    <ul class="nav nav-tabs">

        <li class="nav-item">
            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabPedidoStatus">
                <i class="fa-solid fa-arrows-turn-to-dots"></i>
                <!-- Mobile -->
                <span class="d-inline d-md-none"> Status</span>
                <!-- Desktop -->
                <span class="d-none d-md-inline"> Status do Pedido</span>
            </button>
        </li>

        <li class="nav-item">
            <button class="nav-link btn-config" data-bs-toggle="tab" data-bs-target="#tabGerenciamentoPedido">
                <i class="fa-solid"></i>
                <!-- Mobile -->
                <span class="d-inline d-md-none"> Gerenciamento</span>
                <!-- Desktop -->
                <span class="d-none d-md-inline"> Gerenciamento de Pedido</span>
            </button>
        </li>

    </ul>

    <div class="tab-content pt-3 module-content">
        <!-- STATUS -->
        <div class="tab-pane fade show active" id="tabPedidoStatus">
            <div class="container-fluid">
                <div class="input-group input-group-sm mb-3">
                    <!-- O ID tem de ser exatamente igual ao do JS -->
                    <input type="text" id="inputBuscaPedido" class="form-control" placeholder="Buscar pedido ou shaper...">
                    <button class="btn btn-primary" type="button" onclick="window.executarBuscaPedido()">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>

                <div class="accordion accordion-flush" id="accordionPanelsStayOpenExample">

                </div>
            </div>
        </div>

        <!-- GERENCIAMENTO -->
        <div class="tab-pane fade" id="tabGerenciamentoPedido">

            <div class="container-fluid">

                <div id="alertaPedido" class="alert d-none"></div>

                <div class="card mb-4 border-0">

                    <div class="card-body">

                        <div class="row g-3">

                            <div class="col-md-4">
                                <label class="form-label">Data</label>
                                <input type="date" id="dataPedido" class="form-control form-control-sm">
                            </div>

                            <!-- TIPO DE BLOCO -->
                            <div class="col-md-3">
                                <label class="form-label">Tipo de Bloco</label>
                                <select id="tipo_blocoPedido" class="form-control form-control-sm">
                                    <option value="PU">PU (10 dias)</option>
                                    <option value="EPS">EPS (25 dias)</option>
                                </select>
                            </div>

                            <div class="col-md-5">
                                <label class="form-label">Shaper/Cliente</label>
                                <div class="input-group input-group-sm mb-3">
                                    <select id="id_shaperPedido" class="form-control">
                                    </select>
                                </div>
                            </div>

                            <!-- COMPOSIÇÃO -->
                            <div class="col-md-3">
                                <label class="form-label">Composição</label>
                                <div class="input-group input-group-sm mb-3">
                                    <select id="id_composicaoPedido" class="form-control"></select>
                                    <button class="btn btn-outline-secondary btn-config" type="button" onclick="abrirModalGenerico('composicao')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- VARIAÇÃO -->
                            <div class="col-md-3">
                                <label class="form-label">Variação</label>
                                <div class="input-group input-group-sm mb-3">
                                    <select id="id_variacaoPedido" class="form-control"></select>
                                    <button class="btn btn-outline-secondary btn-config" type="button" onclick="abrirModalGenerico('variacao')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- ACABAMENTO -->
                            <div class="col-md-3">
                                <label class="form-label">Acabamento</label>
                                <div class="input-group input-group-sm mb-3">
                                    <select id="id_acabamentoPedido" class="form-control"></select>
                                    <button class="btn btn-outline-secondary btn-config" type="button" onclick="abrirModalGenerico('acabamento')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- CONFIG QUILHA -->
                            <div class="col-md-3">
                                <label class="form-label">Config. Quilha</label>
                                <div class="input-group input-group-sm mb-3">
                                    <select id="id_configuracaoquilhaPedido" class="form-control"></select>
                                    <button class="btn btn-outline-secondary btn-config" type="button" onclick="abrirModalGenerico('configQuilha')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- SISTEMA QUILHA -->
                            <div class="col-md-3">
                                <label class="form-label">Sistema Quilha</label>
                                <div class="input-group input-group-sm mb-3">
                                    <select id="id_sistemaquilhaPedido" class="form-control"></select>
                                    <button class="btn btn-outline-secondary btn-config" type="button" onclick="abrirModalGenerico('sistemaQuilha')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- CORES -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Cores</label>
                                <div class="input-group-custom">
                                    <select id="id_cor" placeholder="Selecione..." multiple></select>
                                    <button class="choice_plus" type="button" onclick="abrirModalGenerico('cores')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- TECIDO -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Tecido</label>
                                <div class="input-group-custom">
                                    <select id="id_tecidoPedido" placeholder="Selecione..." multiple></select>
                                    <button class="choice_plus btn-config" type="button" onclick="abrirModalGenerico('tecido')">
                                        <i class="fa-solid fa-gear"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- OBSERVAÇÃO -->
                            <div class="col-12">
                                <label class="form-label">Observação</label>
                                <textarea id="observacaoPedido" class="form-control form-control-sm"></textarea>
                            </div>

                            <!-- BOTÕES -->
                            <div class="col-12">
                                <button id="btnSubmitPedido" class="btn btn-sm btn-primary" onclick="cadastrarOuAtualizarPedido()">
                                    <i class="fa-solid fa-plus"></i> Cadastrar
                                </button>

                                <button id="btnCancelarPedido" class="btn btn-sm btn-outline-secondary d-none" onclick="cancelarEdicaoPedido()">
                                    <i class="fa-solid fa-ban"></i> Cancelar
                                </button>
                            </div>

                        </div> <!-- FECHA ROW AQUI -->

                    </div>
                </div>
            </div>

            <div class="table-responsive rounded-1">

                <table class="table table-striped table-hover table-sm">

                    <thead>
                        <tr class="table-dark" style="cursor: pointer;">
                            <th onclick="window.listarPedidos('id_pedido')">ID <i class="fa-solid fa-sort"></i></th>
                            <th onclick="window.listarPedidos('status')">Status <i class="fa-solid fa-sort"></i></th>
                            <th onclick="window.listarPedidos('data')">Data <i class="fa-solid fa-sort"></i></th>
                            <th onclick="window.listarPedidos('shaper')">Shaper <i class="fa-solid fa-sort"></i></th>
                            <th onclick="window.listarPedidos('observacao')">Obs <i class="fa-solid fa-sort"></i></th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody id="listaPedidos"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>