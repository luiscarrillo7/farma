<script>
  import { supabase } from '$lib/supabaseClient';

  let { session } = $props();

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let open = $state(false);
  let medicamentos = $state([]);
  let clientes = $state([]);
  let items = $state([]);
  let clienteId = $state('');
  let isLoading = $state(false);

  let totalGeneral = $derived(
    items.reduce((sum, item) => {
      const med = medicamentos.find(m => m.id === item.medicamentoId);
      const precio = med?.precio_venta || 0;
      return sum + (item.cantidad * precio);
    }, 0)
  );

  async function loadData() {
    if (!session?.access_token) return;
    
    try {
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      
      const [medRes, clientRes] = await Promise.all([
        fetch(`${API_URL}/medicamentos`, { headers }),
        fetch(`${API_URL}/clientes`, { headers })
      ]);

      medicamentos = await medRes.json();
      clientes = await clientRes.json();

      if (!medicamentos || medicamentos.length === 0) {
        alert("No hay medicamentos disponibles para la venta.");
        close();
        return;
      }

      addItem();
    } catch (error) {
      alert(`Error al cargar datos: ${error.message}`);
      close();
    }
  }

  function addItem() {
    items = [...items, {
      id: Date.now(),
      medicamentoId: medicamentos[0]?.id || 0,
      cantidad: 1
    }];
  }

  function removeItem(id) {
    items = items.filter(item => item.id !== id);
  }

  function updateItem(id, field, value) {
    items = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
  }

  function getSubtotal(item) {
    const med = medicamentos.find(m => m.id === item.medicamentoId);
    const precio = med?.precio_venta || 0;
    return item.cantidad * precio;
  }

  function getPrecio(medicamentoId) {
    const med = medicamentos.find(m => m.id === medicamentoId);
    return med?.precio_venta || 0;
  }

  async function submitVenta(e) {
    e.preventDefault();
    
    if (items.length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }

    isLoading = true;

    const ventaData = {
      usuarioId: session.user.id,
      clienteId: clienteId ? parseInt(clienteId) : null,
      items: items.map(item => ({
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
        const errorDetail = JSON.parse(result.detail);
        throw new Error(errorDetail.message || 'Error desconocido.');
      }

      alert(`✅ Venta registrada con éxito!\nID: ${result.venta_id}\nTotal: $${result.total_calculado}`);
      close();
    } catch (error) {
      alert(`❌ Error al registrar la venta: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  function openModal() {
    open = true;
    items = [];
    clienteId = '';
    loadData();
  }

  function close() {
    open = false;
    items = [];
    clienteId = '';
  }
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

<div class="text-center">
  <button 
    onclick={openModal}
    class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transition-all"
  >
    🛒 Registrar Nueva Venta
  </button>
</div>

{#if open}
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
        <h3 class="text-2xl font-bold text-white">Registrar Venta</h3>
        <button 
          onclick={close}
          disabled={isLoading}
          class="text-white hover:bg-white/20 rounded-full p-2 text-3xl disabled:opacity-50 transition-colors"
        >
          &times;
        </button>
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
        <form onsubmit={submitVenta} class="space-y-6">
          <select 
            bind:value={clienteId}
            disabled={isLoading}
            class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
          >
            <option value="">Público General</option>
            {#each clientes as cliente}
              <option value={cliente.id}>
                {cliente.nombre} {cliente.apellido}
              </option>
            {/each}
          </select>

          <div class="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 border-b pb-2">
            <div class="col-span-5">Producto</div>
            <div class="col-span-2 text-center">Cantidad</div>
            <div class="col-span-2 text-center">Precio Unit.</div>
            <div class="col-span-2 text-center">Subtotal</div>
            <div class="col-span-1"></div>
          </div>

          <div class="space-y-3">
            {#each items as item (item.id)}
              <div class="grid grid-cols-12 gap-3 items-center">
                <select 
                  value={item.medicamentoId}
                  onchange={(e) => updateItem(item.id, 'medicamentoId', parseInt(e.target.value))}
                  disabled={isLoading}
                  class="col-span-5 p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  {#each medicamentos as med}
                    <option value={med.id}>
                      {med.nombre} ({med.presentacion})
                    </option>
                  {/each}
                </select>

                <input 
                  type="number"
                  value={item.cantidad}
                  oninput={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                  disabled={isLoading}
                  min="1"
                  class="col-span-2 p-2 border-2 border-gray-300 rounded-lg text-center focus:border-blue-500 focus:outline-none"
                  required
                />

                <input 
                  type="text"
                  value="${getPrecio(item.medicamentoId).toFixed(2)}"
                  disabled
                  class="col-span-2 p-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-center text-gray-600"
                />

                <input 
                  type="text"
                  value="${getSubtotal(item).toFixed(2)}"
                  disabled
                  class="col-span-2 p-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-center font-semibold text-gray-700"
                />

                <button 
                  type="button"
                  onclick={() => removeItem(item.id)}
                  disabled={isLoading || items.length === 1}
                  class="col-span-1 text-red-500 hover:text-red-700 font-bold text-xl flex justify-center disabled:opacity-30"
                >
                  X
                </button>
              </div>
            {/each}
          </div>

          <button 
            type="button"
            onclick={addItem}
            disabled={isLoading}
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            ➕ Añadir Producto
          </button>

          <div class="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
            <div class="text-right">
              <span class="text-lg font-semibold text-gray-700">Total General: </span>
              <span class="text-2xl font-bold text-green-600">${totalGeneral.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || items.length === 0}
            class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Procesando...' : 'Confirmar Venta'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}