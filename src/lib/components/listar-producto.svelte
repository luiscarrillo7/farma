<script>
  // 1. Recibe la sesión para poder autenticar la petición a la API.
  let { session } = $props();

  // 2. Define la URL de tu API, igual que en el componente de Venta.
  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  // 3. Define el estado reactivo para guardar los datos, el estado de carga y los errores.
  let productos = $state([]);
  let isLoading = $state(true);
  let error = $state(null);

  // 4. Utiliza $effect para cargar los datos cuando el componente se renderiza.
  $effect(() => {
    async function fetchProductos() {
      // Valida que el token de acceso exista antes de hacer la llamada.
      if (!session?.access_token) {
        error = "No se pudo autenticar la sesión del usuario.";
        isLoading = false;
        return;
      }

      try {
        const response = await fetch(`${API_URL}/medicamentos`, {
          headers: {
            // Envía el token de Supabase a tu API de ASP.NET para la autorización.
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron obtener los productos.`);
        }

        // Si la respuesta es exitosa, guarda los productos en el estado.
        productos = await response.json();
        
      } catch (e) {
        // Si ocurre cualquier error, guárdalo para mostrarlo en la UI.
        console.error("Error al cargar productos:", e);
        error = e.message;
      } finally {
        // Al final, indica que la carga ha terminado.
        isLoading = false;
      }
    }

    fetchProductos();
  });
</script>

<div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
  <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
    📦 Listado de Productos
  </h2>

  {#if isLoading}
    <p class="text-center text-gray-500 py-4">⏳ Cargando productos, por favor espere...</p>
  {:else if error}
    <p class="text-center text-red-600 bg-red-100 p-4 rounded-lg font-semibold">❌ Error: {error}</p>
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