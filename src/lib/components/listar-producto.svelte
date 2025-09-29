<script>
  // 1. AHORA RECIBE 'productos' COMO UNA PROP DESDE EL DASHBOARD
  //    Ya no necesita hacer su propio fetch, ni manejar estados de carga o error.
  let { session, productos } = $props();
</script>

<div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
  <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
    📦 Listado de Productos
  </h2>

  {#if !productos || productos.length === 0}
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