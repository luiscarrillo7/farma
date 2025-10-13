<script>
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();

  let lotes = [];
  let cargando = true;
  let error = null;

  onMount(async () => {
    try {
      const res = await fetch("https://farmacia-269414280318.europe-west1.run.app/lotes");
      if (!res.ok) throw new Error("Error al cargar los lotes");
      lotes = await res.json();
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  });

  function cerrar() {
    dispatch("close");
  }

  function seleccionarLote(lote) {
    dispatch("select", lote);
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
  <div class="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-3/4 max-h-[80vh] overflow-auto">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">📦 Seleccionar Lote</h2>
      <button
        on:click={cerrar}
        class="text-gray-500 hover:text-gray-800 text-xl font-bold"
      >
        ✖
      </button>
    </div>

    {#if cargando}
      <p class="text-gray-500">Cargando lotes...</p>
    {:else if error}
      <p class="text-red-500">❌ {error}</p>
    {:else if lotes.length === 0}
      <p>No hay lotes registrados.</p>
    {:else}
      <table class="w-full border-collapse border border-gray-300 text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">ID</th>
            <th class="border p-2">Medicamento</th>
            <th class="border p-2">Categoría</th>
            <th class="border p-2">Proveedor</th>
            <th class="border p-2">Ingreso</th>
            <th class="border p-2">Vencimiento</th>
            <th class="border p-2">Stock</th>
            <th class="border p-2">Precio</th>
          </tr>
        </thead>
        <tbody>
          {#each lotes as lote}
            <tr
              class="hover:bg-blue-100 cursor-pointer transition"
              on:click={() => seleccionarLote(lote)}
            >
              <td class="border p-2 text-center">{lote.id}</td>
              <td class="border p-2">{lote.medicamentos?.nombre_comercial}</td>
              <td class="border p-2">{lote.medicamentos?.categoria}</td>
              <td class="border p-2">{lote.proveedores?.nombre}</td>
              <td class="border p-2 text-center">
                {new Date(lote.fecha_ingreso).toLocaleDateString('es-PE')}
              </td>
              <td class="border p-2 text-center">
                {new Date(lote.fecha_vencimiento).toLocaleDateString('es-PE')}
              </td>
              <td class="border p-2 text-center">{lote.cantidad_actual}</td>
              <td class="border p-2 text-right">S/ {lote.precio_compra?.toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
