<script>
  import { supabase } from '$lib/supabaseClient';
  import { createEventDispatcher } from 'svelte';

  let { isOpen = $bindable(false) } = $props();

  const dispatch = createEventDispatcher();
  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let medicamentos = $state([]);
  let proveedores = $state([]);
  let isLoading = $state(false);

  // Caché para evitar múltiples solicitudes
  let medicamentosCache = $state(null);
  let proveedoresCache = $state(null);
  let cacheTimestamp = $state(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Datos del formulario
  let medicamentoId = $state("");
  let proveedorId = $state("");
  let fechaIngreso = $state("");
  let fechaVencimiento = $state("");
  let cantidadInicial = $state(0);
  let cantidadActual = $state(0);
  let precioCompra = $state(0);

  async function loadData() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    const now = Date.now();
    const cacheIsValid = (now - cacheTimestamp) < CACHE_DURATION;

    // Usar caché si está disponible y es válido
    if (cacheIsValid && medicamentosCache && proveedoresCache) {
      medicamentos = medicamentosCache;
      proveedores = proveedoresCache;
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [medRes, provRes] = await Promise.all([
        fetch(`${API_URL}/medicamentos`, { headers }),
        fetch(`${API_URL}/proveedores`, { headers })
      ]);

      medicamentos = await medRes.json();
      proveedores = await provRes.json();

      // Guardar en caché
      medicamentosCache = medicamentos;
      proveedoresCache = proveedores;
      cacheTimestamp = Date.now();
    } catch (error) {
      alert(`Error al cargar datos: ${error.message}`);
    }
  }

  async function agregarLote(e) {
    e.preventDefault();
    
    isLoading = true;

    const token = (await supabase.auth.getSession()).data.session?.access_token;

    try {
      const response = await fetch(`${API_URL}/lotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          medicamento_id: medicamentoId,
          proveedor_id: proveedorId,
          fecha_ingreso: fechaIngreso,
          fecha_vencimiento: fechaVencimiento,
          cantidad_inicial: cantidadInicial,
          cantidad_actual: cantidadActual,
          precio_compra: precioCompra
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert("✅ Lote agregado con éxito");
        limpiarFormulario();
        cacheTimestamp = 0; // Invalidar caché
        dispatch('loteAgregado');
        close();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Error al guardar el lote");
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  function limpiarFormulario() {
    medicamentoId = "";
    proveedorId = "";
    fechaIngreso = "";
    fechaVencimiento = "";
    cantidadInicial = 0;
    cantidadActual = 0;
    precioCompra = 0;
  }

  function close() {
    isOpen = false;
    limpiarFormulario();
    dispatch('close');
  }

  function openModal() {
    isOpen = true;
    limpiarFormulario();
    loadData();
  }

  // Exponer función para abrir desde el padre
  export { openModal };
</script>

<svelte:head>
  <style>
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
  </style>
</svelte:head>

{#if isOpen}
  <div class="modal-overlay">
    <div 
      class="modal-backdrop"
      onclick={close}
      onkeydown={(e) => e.key === 'Escape' && close()}
      role="button"
      tabindex="-1"
    ></div>
    
    <div class="modal-content">
      <div class="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <h3 class="text-2xl font-bold text-white">Agregar Lote</h3>
        <button 
          onclick={close}
          disabled={isLoading}
          class="text-white hover:bg-white/20 rounded-full p-2 text-3xl disabled:opacity-50 transition-colors"
        >
          &times;
        </button>
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
        <form onsubmit={agregarLote} class="space-y-4">
          <div>
            <label for="medicamento" class="block mb-2 font-semibold text-gray-700">Medicamento</label>
            <select 
              id="medicamento" 
              bind:value={medicamentoId} 
              disabled={isLoading}
              class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
              required
            >
              <option value="">-- Seleccione --</option>
              {#each medicamentos as m}
                <option value={m.id}>{m.nombre}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="proveedor" class="block mb-2 font-semibold text-gray-700">Proveedor</label>
            <select 
              id="proveedor" 
              bind:value={proveedorId} 
              disabled={isLoading}
              class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
              required
            >
              <option value="">-- Seleccione --</option>
              {#each proveedores as p}
                <option value={p.id}>{p.nombre}</option>
              {/each}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="fechaIngreso" class="block mb-2 font-semibold text-gray-700">Fecha Ingreso</label>
              <input 
                id="fechaIngreso" 
                type="date" 
                bind:value={fechaIngreso} 
                disabled={isLoading}
                class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
                required
              />
            </div>
            <div>
              <label for="fechaVencimiento" class="block mb-2 font-semibold text-gray-700">Fecha Vencimiento</label>
              <input 
                id="fechaVencimiento" 
                type="date" 
                bind:value={fechaVencimiento} 
                disabled={isLoading}
                class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="cantidadInicial" class="block mb-2 font-semibold text-gray-700">Cantidad Inicial</label>
              <input 
                id="cantidadInicial" 
                type="number" 
                bind:value={cantidadInicial} 
                disabled={isLoading}
                min="0"
                class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
                required
              />
            </div>
            <div>
              <label for="cantidadActual" class="block mb-2 font-semibold text-gray-700">Cantidad Actual</label>
              <input 
                id="cantidadActual" 
                type="number" 
                bind:value={cantidadActual} 
                disabled={isLoading}
                min="0"
                class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
                required
              />
            </div>
          </div>

          <div>
            <label for="precioCompra" class="block mb-2 font-semibold text-gray-700">Precio Compra</label>
            <input 
              id="precioCompra" 
              type="number" 
              step="0.01" 
              bind:value={precioCompra} 
              disabled={isLoading}
              min="0"
              class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
              required
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              type="button"
              onclick={close}
              disabled={isLoading}
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Guardando...' : 'Guardar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}