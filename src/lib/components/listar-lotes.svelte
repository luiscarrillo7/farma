<script>
  import { onMount } from 'svelte';

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
</script>

<div class="p-6 bg-white rounded-lg shadow">
  <h2 class="text-2xl font-bold mb-4">📦 Lotes Registrados</h2>

  {#if cargando}
    <p>Cargando lotes...</p>
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
          <th class="border p-2">Proveedor</th>
          <th class="border p-2">Ingreso</th>
          <th class="border p-2">Vencimiento</th>
          <th class="border p-2">Cant. Inicial</th>
          <th class="border p-2">Cant. Actual</th>
          <th class="border p-2">Precio Compra</th>
        </tr>
      </thead>
      <tbody>
        {#each lotes as lote}
          <tr class="hover:bg-gray-50">
            <td class="border p-2">{lote.id}</td>
            <td class="border p-2">{lote.medicamentos?.nombre}</td>
            <td class="border p-2">{lote.proveedores?.nombre}</td>
            <td class="border p-2">{new Date(lote.fecha_ingreso).toLocaleDateString()}</td>
            <td class="border p-2">{lote.fecha_vencimiento}</td>
            <td class="border p-2 text-center">{lote.cantidad_inicial}</td>
            <td class="border p-2 text-center">{lote.cantidad_actual}</td>
            <td class="border p-2 text-right">S/ {lote.precio_compra.toFixed(2)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
