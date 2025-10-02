<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Página de Registro de Venta</title>
    <!-- Inclusión de Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Inclusión del cliente de Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-gray-100">

    <!-- Contenedor Principal de la Página -->
    <main class="container mx-auto p-4 sm:p-6 lg:p-8">
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                <h1 class="text-2xl font-bold text-white">Registrar Venta</h1>
            </div>

            <div class="p-6">
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
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // --- CONFIGURACIÓN ---
            const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';
            const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
            
            // --- CONFIGURACIÓN DE SUPABASE ---
            // IMPORTANTE: Reemplaza con la URL y la clave anónima de tu proyecto de Supabase
            const SUPABASE_URL = 'TU_SUPABASE_URL'; 
            const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
            const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


            // --- ESTADO DE LA APLICACIÓN ---
            let state = {
                session: null, // Se llenará con la sesión real de Supabase
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
            const ventaForm = document.getElementById('ventaForm');
            const clienteSelect = document.getElementById('clienteSelect');
            const itemsContainer = document.getElementById('itemsContainer');
            const addItemBtn = document.getElementById('addItemBtn');
            const totalGeneralEl = document.getElementById('totalGeneral');
            const submitBtn = document.getElementById('submitBtn');

            // --- FUNCIONES DE LÓGICA ---

            // Carga los datos de medicamentos y clientes desde la API
            async function loadData() {
                if (!state.session) {
                    alert('No hay una sesión de usuario activa. Por favor, inicie sesión.');
                    return;
                }
                
                const now = Date.now();
                const cacheIsValid = (now - state.cacheTimestamp) < CACHE_DURATION;

                if (cacheIsValid && state.medicamentosCache && state.clientesCache) {
                    state.medicamentos = state.medicamentosCache;
                    state.clientes = state.clientesCache;
                } else {
                    try {
                        setState({ isLoading: true });
                        const headers = { 'Authorization': `Bearer ${state.session.access_token}` };
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
                        return;
                    } finally {
                        setState({ isLoading: false });
                    }
                }

                if (!state.medicamentos || state.medicamentos.length === 0) {
                    alert("No hay medicamentos disponibles para la venta.");
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
                    usuarioId: state.session.user.id,
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
                            'Authorization': `Bearer ${state.session.access_token}`
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
                    resetForm();
                } catch (error) {
                    alert(`❌ Error al registrar la venta: ${error.message}`);
                } finally {
                    setState({ isLoading: false });
                }
            }
            
            // Reinicia el formulario a su estado inicial
            function resetForm() {
                setState({
                    items: [],
                    clienteId: ''
                });
                // Añade una fila vacía para la siguiente venta
                if (state.medicamentos.length > 0) {
                   addItem();
                }
            }

            // --- FUNCIONES DE RENDERIZADO ---

            // Función central para actualizar la UI basada en el estado
            function render() {
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

            // --- INICIALIZACIÓN ---
            async function initialize() {
                if(SUPABASE_URL === 'TU_SUPABASE_URL' || SUPABASE_ANON_KEY === 'TU_SUPABASE_ANON_KEY') {
                    alert('Error de configuración: Por favor, introduce tu URL y clave anónima de Supabase en el script.');
                    return;
                }

                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    alert('Error al obtener la sesión de Supabase.');
                    return;
                }
                if (!data.session) {
                    alert('No hay sesión activa. Por favor, inicia sesión.');
                    // Opcional: Redirigir a la página de login
                    // window.location.href = '/login.html'; 
                    return;
                }

                state.session = data.session;
                loadData(); // Cargar datos después de obtener la sesión
            }

            initialize();
        });
    </script>
</body>
</html>

