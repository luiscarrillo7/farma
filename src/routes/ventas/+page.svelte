<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { session } = $props();

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

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
        fetch(`${API_URL}/medicamentos-con-stock`, { headers }),
        fetch(`${API_URL}/clientes`, { headers })
      ]);

      medicamentos = await medRes.json();
      clientes = await clientRes.json();

      if (!medicamentos || medicamentos.length === 0) {
        alert("No hay medicamentos disponibles para la venta.");
        return;
      }

      addItem();
    } catch (error) {
      alert(`Error al cargar datos: ${error.message}`);
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

  function getStock(medicamentoId) {
    const med = medicamentos.find(m => m.id === medicamentoId);
    return med?.stock || 0;
  }

  async function submitVenta(e) {
    e.preventDefault();
    
    if (items.length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }

    // Validar stock
    for (const item of items) {
      const stock = getStock(item.medicamentoId);
      if (item.cantidad > stock) {
        const med = medicamentos.find(m => m.id === item.medicamentoId);
        alert(`Stock insuficiente para ${med.nombre}. Disponible: ${stock}`);
        return;
      }
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

      alert(`Venta registrada con éxito!\nID: ${result.venta_id}\nTotal: $${result.total_calculado}`);
      
      // Redirigir a la lista de ventas o limpiar el formulario
      items = [];
      clienteId = '';
      loadData();
    } catch (error) {
      alert(`Error al registrar la venta: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  function cancelar() {
    if (confirm('¿Está seguro de cancelar esta venta?')) {
      goto('/dashboard');
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6 pb-4 border-b-2">
        <h1 class="text-3xl font-bold text-gray-800">Registrar Nueva Venta</h1>
        <button 
          onclick={cancelar}
          disabled={isLoading}
          class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      <form onsubmit={submitVenta} class="space-y-6">
        <div>
          <label for="cliente-select" class="block text-sm font-semibold text-gray-700 mb-2">
            Cliente
          </label>
          <select 
            id="cliente-select"
            bind:value={clienteId}
            disabled={isLoading}
            class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
          >
            <option value="">Público General</option>
            {#each clientes as cliente}
              <option value={cliente.id}>
                {cliente.nombre} {cliente.apellido} - DNI: {cliente.dni}
              </option>
            {/each}
          </select>
        </div>

        <div>
          <div class="block text-sm font-semibold text-gray-700 mb-2">
            Productos
          </div>
          
          <div class="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 bg-gray-100 p-3 rounded-t-lg">
            <div class="col-span-4">Producto</div>
            <div class="col-span-2 text-center">Stock</div>
            <div class="col-span-2 text-center">Cantidad</div>
            <div class="col-span-2 text-center">P. Unit.</div>
            <div class="col-span-1 text-center">Subtotal</div>
            <div class="col-span-1"></div>
          </div>

          <div class="border-2 border-gray-200 rounded-b-lg p-4 space-y-3">
            {#each items as item (item.id)}
              <div class="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-lg">
                <select 
                  value={item.medicamentoId}
                  onchange={(e) => updateItem(item.id, 'medicamentoId', parseInt(e.target.value))}
                  disabled={isLoading}
                  class="col-span-4 p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  {#each medicamentos as med}
                    <option value={med.id}>
                      {med.nombre} ({med.presentacion})
                    </option>
                  {/each}
                </select>

                <div class="col-span-2 text-center font-semibold text-gray-700">
                  {getStock(item.medicamentoId)}
                </div>

                <input 
                  type="number"
                  value={item.cantidad}
                  oninput={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                  disabled={isLoading}
                  min="1"
                  max={getStock(item.medicamentoId)}
                  class="col-span-2 p-2 border-2 border-gray-300 rounded-lg text-center focus:border-blue-500 focus:outline-none"
                  required
                />

                <div class="col-span-2 text-center font-semibold text-gray-700">
                  S/ {getPrecio(item.medicamentoId).toFixed(2)}
                </div>

                <div class="col-span-1 text-center font-bold text-green-600">
                  S/ {getSubtotal(item).toFixed(2)}
                </div>

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
            class="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            + Añadir Producto
          </button>
        </div>

        <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
          <div class="flex justify-between items-center">
            <span class="text-2xl font-bold text-gray-700">Total General:</span>
            <span class="text-4xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isLoading || items.length === 0}
          class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg text-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Procesando...' : 'Confirmar Venta'}
        </button>
      </form>
    </div>
  </div>
</div>