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

  // Computed: Total general
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

      // Añadir primer item por defecto
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

<main class="p-8 text-center">
  <button 
    onclick={openModal}
    class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl"
  >
    🛒 Registrar Nueva Venta
  </button>
</main>

{#if open}
  <div class="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50">
    <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-blue-700">Registrar Venta</h3>
        <button 
          onclick={close}
          disabled={isLoading}
          class="text-gray-500 text-3xl hover:text-gray-800 disabled:opacity-50"
        >
          &times;
        </button>
      </div>

      <form onsubmit={submitVenta} class="space-y-4">
        <!-- Cliente -->
        <select 
          bind:value={clienteId}
          disabled={isLoading}
          class="w-full p-2 border rounded"
        >
          <option value="">Público General</option>
          {#each clientes as cliente}
            <option value={cliente.id}>
              {cliente.nombre} {cliente.apellido}
            </option>
          {/each}
        </select>

        <!-- Headers -->
        <div class="grid grid-cols-12 gap-2 mt-4 text-xs font-bold text-gray-600">
          <div class="col-span-5">Producto</div>
          <div class="col-span-2 text-center">Cantidad</div>
          <div class="col-span-2 text-center">Precio Unit.</div>
          <div class="col-span-2 text-center">Subtotal</div>
        </div>

        <!-- Items Container -->
        <div class="space-y-2 border-t pt-2">
          {#each items as item (item.id)}
            <div class="grid grid-cols-12 gap-2 items-center">
              <!-- Medicamento Select -->
              <select 
                value={item.medicamentoId}
                onchange={(e) => updateItem(item.id, 'medicamentoId', parseInt(e.target.value))}
                disabled={isLoading}
                class="col-span-5 p-2 border rounded"
                required
              >
                {#each medicamentos as med}
                  <option value={med.id}>
                    {med.nombre} ({med.presentacion})
                  </option>
                {/each}
              </select>

              <!-- Cantidad -->
              <input 
                type="number"
                value={item.cantidad}
                oninput={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                disabled={isLoading}
                min="1"
                class="col-span-2 p-2 border rounded text-center"
                required
              />

              <!-- Precio Unitario -->
              <input 
                type="text"
                value="${getPrecio(item.medicamentoId).toFixed(2)}"
                disabled
                class="col-span-2 p-2 border rounded bg-gray-100 text-center"
              />

              <!-- Subtotal -->
              <input 
                type="text"
                value="${getSubtotal(item).toFixed(2)}"
                disabled
                class="col-span-2 p-2 border rounded bg-gray-200 text-center"
              />

              <!-- Remove Button -->
              <button 
                type="button"
                onclick={() => removeItem(item.id)}
                disabled={isLoading || items.length === 1}
                class="text-red-500 font-bold justify-self-center disabled:opacity-30"
              >
                X
              </button>
            </div>
          {/each}
        </div>

        <!-- Add Item Button -->
        <button 
          type="button"
          onclick={addItem}
          disabled={isLoading}
          class="bg-gray-200 hover:bg-gray-300 p-2 rounded disabled:opacity-50"
        >
          ➕ Añadir Producto
        </button>

        <!-- Total General -->
        <div class="text-right font-bold text-xl mt-4">
          Total General: <span class="text-green-600">${totalGeneral.toFixed(2)}</span>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          disabled={isLoading || items.length === 0}
          class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ Procesando...' : 'Confirmar Venta'}
        </button>
      </form>
    </div>
  </div>
{/if}