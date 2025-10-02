<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plantilla de Modal de Venta</title>
    <!-- Inclusión de Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Estilos personalizados para el modal, equivalentes a los de Svelte */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 9999;
        }
        .modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }
        .modal-content {
            position: relative;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 48rem;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
        }
        /* Clase para ocultar el modal */
        .hidden {
            display: none;
        }
    </style>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">

    <!-- Botón para abrir el Modal -->
    <div class="text-center">
        <button 
            id="openModalBtn"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transition-all"
        >
            🛒 Registrar Nueva Venta
        </button>
    </div>

    <!-- Contenedor del Modal -->
    <div id="modal" class="modal-overlay hidden">
        <div id="modalBackdrop" class="modal-backdrop"></div>
        
        <div class="modal-content">
            <div class="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                <h3 class="text-2xl font-bold text-white">Registrar Venta</h3>
                <button id="closeModalBtn" class="text-white hover:bg-white/20 rounded-full p-2 text-3xl disabled:opacity-50 transition-colors">
                    &times;
                </button>
            </div>

            <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                <form id="ventaForm" class="space-y-6">
                    <!-- Selector de Cliente -->
                    <select id="clienteSelect" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700">
                        <option value="">Público General</option>
                        <!-- Opciones de clientes se cargarán aquí -->
                    </select>

                    <!-- Cabecera de la tabla de items -->
                    <div class="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 border-b pb-2">
                        <div class="col-span-5">Producto</div>
                        <div class="col-span-2 text-center">Cantidad</div>
                        <div class="col-span-2 text-center">Precio Unit.</div>
                        <div class="col-span-2 text-center">Subtotal</div>
                        <div class="col-span-1"></div>
                    </div>

                    <!-- Contenedor para los items de la venta -->
                    <div id="itemsContainer" class="space-y-3">
                        <!-- Los items de la venta se renderizarán aquí -->
                    </div>

                    <!-- Botón para añadir producto -->
                    <button 
                        type="button"
                        id="addItemBtn"
                        class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        ➕ Añadir Producto
                    </button>

                    <!-- Total General -->
                    <div class="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                        <div class="text-right">
                            <span class="text-lg font-semibold text-gray-700">Total General: </span>
                            <span id="totalGeneral" class="text-2xl font-bold text-green-600">$0.00</span>
                        </div>
                    </div>

                    <!-- Botón de Confirmar Venta -->
                    <button 
                        type="submit"
                        id="submitBtn"
                        class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar Venta
                    </button>
                </form>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // --- CONFIGURACIÓN ---
            const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';
            // Simulación del objeto 'session'. Reemplaza esto con tu lógica de autenticación real.
            const session = {
                access_token: 'TU_ACCESS_TOKEN_AQUI', // IMPORTANTE: Reemplazar con el token real
                user: {
                    id: 'TU_USER_ID_AQUI' // IMPORTANTE: Reemplazar con el ID de usuario real
                }
            };
            const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

            // --- ESTADO DE LA APLICACIÓN ---
            let state = {
                open: false,
                medicamentos: [],
                clientes: [],
                items: [],
                clienteId: '',
                isLoading: false,
                medicamentosCache: null,
                clientesCache: null,
                cacheTimestamp: 0
            };

            // --- REFERENCIAS AL DOM ---
            const modal = document.getElementById('modal');
            const openModalBtn = document.getElementById('openModalBtn');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const modalBackdrop = document.getElementById('modalBackdrop');
            const ventaForm = document.getElementById('ventaForm');
            const clienteSelect = document.getElementById('clienteSelect');
            const itemsContainer = document.getElementById('itemsContainer');
            const addItemBtn = document.getElementById('addItemBtn');
            const totalGeneralEl = document.getElementById('totalGeneral');
            const submitBtn = document.getElementById('submitBtn');

            // --- FUNCIONES DE LÓGICA ---

            // Carga los datos de medicamentos y clientes desde la API
            async function loadData() {
                if (!session?.access_token) return;
                
                const now = Date.now();
                const cacheIsValid = (now - state.cacheTimestamp) < CACHE_DURATION;

                if (cacheIsValid && state.medicamentosCache && state.clientesCache) {
                    state.medicamentos = state.medicamentosCache;
                    state.clientes = state.clientesCache;
                } else {
                    try {
                        setState({ isLoading: true });
                        const headers = { 'Authorization': `Bearer ${session.access_token}` };
                        const [medRes, clientRes] = await Promise.all([
                            fetch(`${API_URL}/medicamentos`, { headers }),
                            fetch(`${API_URL}/clientes`, { headers })
                        ]);
                        
                        if (!medRes.ok || !clientRes.ok) throw new Error('Error al conectar con el servidor.');

                        state.medicamentos = await medRes.json();
                        state.clientes = await clientRes.json();
                        
                        state.medicamentosCache = state.medicamentos;
                        state.clientesCache = state.clientes;
                        state.cacheTimestamp = Date.now();
                    } catch (error) {
                        alert(`Error al cargar datos: ${error.message}`);
                        close();
                        return;
                    } finally {
                        setState({ isLoading: false });
                    }
                }

                if (!state.medicamentos || state.medicamentos.length === 0) {
                    alert("No hay medicamentos disponibles para la venta.");
                    close();
                    return;
                }

                if (state.items.length === 0) {
                   addItem();
                }
                render();
            }

            // Añade un nuevo item a la lista de venta
            function addItem() {
                const newItem = {
                    id: Date.now(),
                    medicamentoId: state.medicamentos[0]?.id || 0,
                    cantidad: 1
                };
                setState({ items: [...state.items, newItem] });
            }

            // Elimina un item de la lista
            function removeItem(id) {
                setState({ items: state.items.filter(item => item.id !== id) });
            }

            // Actualiza un campo de un item (medicamentoId o cantidad)
            function updateItem(id, field, value) {
                const newItems = state.items.map(item =>
                    item.id === id ? { ...item, [field]: value } : item
                );
                setState({ items: newItems });
            }

            // Envía la venta a la API
            async function submitVenta(e) {
                e.preventDefault();
                if (state.items.length === 0) {
                    alert("Debe agregar al menos un producto.");
                    return;
                }
                setState({ isLoading: true });

                const ventaData = {
                    usuarioId: session.user.id,
                    clienteId: state.clienteId ? parseInt(state.clienteId) : null,
                    items: state.items.map(item => ({
                        medicamento_id: parseInt(item.medicamentoId),
                        cantidad: parseInt(item.cantidad)
                    }))
                };

                try {
                    const response = await fetch(`${API_URL}/ventas`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify(ventaData)
                    });
                    
                    const result = await response.json();
                    
                    if (!response.ok) {
                        const errorDetail = result.detail ? JSON.parse(result.detail) : { message: 'Error desconocido.' };
                        throw new Error(errorDetail.message);
                    }
                    
                    alert(`✅ Venta registrada con éxito!\nID: ${result.venta_id}\nTotal: $${result.total_calculado}`);
                    state.cacheTimestamp = 0; // Invalidar caché
                    close();
                } catch (error) {
                    alert(`❌ Error al registrar la venta: ${error.message}`);
                } finally {
                    setState({ isLoading: false });
                }
            }
            
            // Abre el modal y reinicia el estado
            function open() {
                setState({
                    open: true,
                    items: [],
                    clienteId: ''
                });
                loadData();
            }

            // Cierra el modal y reinicia el estado
            function close() {
                setState({
                    open: false,
                    items: [],
                    clienteId: ''
                });
            }

            // --- FUNCIONES DE RENDERIZADO ---

            // Función central para actualizar la UI basada en el estado
            function render() {
                // Visibilidad del Modal
                modal.classList.toggle('hidden', !state.open);

                // Renderizar clientes
                clienteSelect.innerHTML = '<option value="">Público General</option>' + 
                    state.clientes.map(c => `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`).join('');
                clienteSelect.value = state.clienteId;
                
                // Renderizar items
                itemsContainer.innerHTML = state.items.map(item => renderItem(item)).join('');
                
                // Calcular y mostrar total
                const totalGeneral = state.items.reduce((sum, item) => {
                    const med = state.medicamentos.find(m => m.id == item.medicamentoId);
                    const precio = med?.precio_venta || 0;
                    return sum + (item.cantidad * precio);
                }, 0);
                totalGeneralEl.textContent = `$${totalGeneral.toFixed(2)}`;

                // Actualizar estado de los botones
                const disabled = state.isLoading;
                closeModalBtn.disabled = disabled;
                clienteSelect.disabled = disabled;
                addItemBtn.disabled = disabled;
                submitBtn.disabled = disabled || state.items.length === 0;
                submitBtn.textContent = disabled ? '⏳ Procesando...' : 'Confirmar Venta';
                
                // Habilitar/deshabilitar elementos de los items
                document.querySelectorAll('.item-control').forEach(el => el.disabled = disabled);
                document.querySelectorAll('.remove-item-btn').forEach((btn, index) => {
                    btn.disabled = disabled || state.items.length === 1
                });
            }
            
            // Crea el HTML para un solo item de la venta
            function renderItem(item) {
                const medOptions = state.medicamentos.map(med => 
                    `<option value="${med.id}" ${med.id == item.medicamentoId ? 'selected' : ''}>
                        ${med.nombre} (${med.presentacion})
                    </option>`
                ).join('');
                
                const medActual = state.medicamentos.find(m => m.id == item.medicamentoId);
                const precio = medActual?.precio_venta || 0;
                const subtotal = (item.cantidad * precio).toFixed(2);

                return `
                    <div class="grid grid-cols-12 gap-3 items-center" data-item-id="${item.id}">
                        <select class="col-span-5 p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none item-control item-medicamento" required>${medOptions}</select>
                        <input type="number" value="${item.cantidad}" min="1" class="col-span-2 p-2 border-2 border-gray-300 rounded-lg text-center focus:border-blue-500 focus:outline-none item-control item-cantidad" required />
                        <input type="text" value="$${precio.toFixed(2)}" disabled class="col-span-2 p-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-center text-gray-600" />
                        <input type="text" value="$${subtotal}" disabled class="col-span-2 p-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-center font-semibold text-gray-700" />
                        <button type="button" class="col-span-1 text-red-500 hover:text-red-700 font-bold text-xl flex justify-center disabled:opacity-30 remove-item-btn">X</button>
                    </div>
                `;
            }

            // Función para actualizar el estado y disparar un renderizado
            function setState(newState) {
                Object.assign(state, newState);
                render();
            }
            
            // --- EVENT LISTENERS ---
            openModalBtn.addEventListener('click', open);
            closeModalBtn.addEventListener('click', close);
            modalBackdrop.addEventListener('click', close);
            addItemBtn.addEventListener('click', addItem);
            ventaForm.addEventListener('submit', submitVenta);

            clienteSelect.addEventListener('change', (e) => {
                state.clienteId = e.target.value; // No necesita re-renderizar todo
            });

            // Delegación de eventos para los items
            itemsContainer.addEventListener('change', (e) => {
                const target = e.target;
                const itemDiv = target.closest('[data-item-id]');
                if (!itemDiv) return;

                const itemId = parseInt(itemDiv.dataset.itemId);
                
                if (target.classList.contains('item-medicamento')) {
                    updateItem(itemId, 'medicamentoId', parseInt(target.value));
                } else if (target.classList.contains('item-cantidad')) {
                    updateItem(itemId, 'cantidad', parseInt(target.value) || 1);
                }
            });

            itemsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-item-btn')) {
                    const itemDiv = e.target.closest('[data-item-id]');
                    if (itemDiv) {
                        removeItem(parseInt(itemDiv.dataset.itemId));
                    }
                }
            });

            // Cerrar con la tecla Escape
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.open) {
                    close();
                }
            });

        });
    </script>
</body>
</html>
