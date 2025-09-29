<script>
  let { session } = $props();

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let productos = $state([]);
  let isLoading = $state(false);
  let error = $state(null);
  let hasFetched = $state(false); // ← NUEVO: Bandera para evitar múltiples fetches

  // ← OPTIMIZACIÓN: Solo ejecutar UNA VEZ
  $effect(() => {
    // Si ya cargamos datos, no volver a cargar
    if (hasFetched) return;
    
    async function fetchProductos() {
      if (!session?.access_token) {
        error = "No se pudo autenticar la sesión del usuario.";
        isLoading = false;
        return;
      }

      isLoading = true;

      try {
        const response = await fetch(`${API_URL}/medicamentos`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron obtener los productos.`);
        }

        productos = await response.json();
        hasFetched = true; // ← Marcar como cargado
        
      } catch (e) {
        console.error("Error al cargar productos:", e);
        error = e.message;
      } finally {
        isLoading = false;
      }
    }

    // ← OPTIMIZACIÓN: Pequeño delay para evitar race conditions
    const timeoutId = setTimeout(fetchProductos, 100);
    
    return () => clearTimeout(timeoutId); // Cleanup
  });

  // ← NUEVO: Función para refrescar datos manualmente
  async function refrescarProductos() {
    hasFetched = false;
    error = null;
    productos = [];
  }
</script>

<div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
  <div class="flex justify-between items-center mb-4 border-b pb-2">
    <h2 class="text-2xl font-bold text-gray-800">
      📦 Listado de Productos
    </h2>
    <!-- ← NUEVO: Botón para refrescar -->
    <button 
      onclick={refrescarProductos}
      disabled={isLoading}
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
    >
      {isLoading ? '⏳ Cargando...' : '🔄 Refrescar'}
    </button>
  </div>

  {#if isLoading}
    <p class="text-center text-gray-500 py-4">⏳ Cargando productos, por favor espere...</p>
  {:else if error}
    <div class="text-center">
      <p class="text-red-600 bg-red-100 p-4 rounded-lg font-semibold mb-4">❌ Error: {error}</p>
      <button 
        onclick={refrescarProductos}
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Reintentar
      </button>
    </div>
  {:else if productos.length === 0}
    <p class="text-center text-gray-600 py-4">📋 No se encontraron productos para mostrar.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presentación</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each productos as producto (producto.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.id}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{producto.nombre}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.presentacion}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-semibold">
                S/ {producto.precio_venta.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold {producto.stock > 10 ? 'text-blue-600' : 'text-orange-500'}">
                {producto.stock}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>