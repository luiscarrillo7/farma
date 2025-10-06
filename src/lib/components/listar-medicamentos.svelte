<script>
  import { onMount } from 'svelte';

  let medicamentos = [];
  let cargando = true;
  let error = null;

  onMount(async () => {
    try {
      const res = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos");
      if (!res.ok) throw new Error("Error al cargar los medicamentos");
      medicamentos = await res.json();
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  });
</script>

<div class="p-6 bg-white rounded-lg shadow">
  <h2 class="text-2xl font-bold mb-4">💊 Medicamentos Registrados</h2>

  {#if cargando}
    <p>Cargando medicamentos...</p>
  {:else if error}
    <p class="text-red-500">❌ {error}</p>
  {:else if medicamentos.length === 0}
    <p>No hay medicamentos registrados.</p>
  {:else}
    <table class="w-full border-collapse border border-gray-300 text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="border p-2">ID</th>
          <th class="border p-2">Nombre Comercial</th>
          <th class="border p-2">Nombre Genérico</th>
          <th class="border p-2">Forma Farmacéutica</th>
          <th class="border p-2">Concentración</th>
          <th class="border p-2">Categoría</th>
          <th class="border p-2">Laboratorio</th>
          <th class="border p-2">Precio Venta</th>
          <th class="border p-2">Creado</th>
        </tr>
      </thead>
      <tbody>
        {#each medicamentos as med}
          <tr class="hover:bg-gray-50">
            <td class="border p-2">{med.id}</td>
            <td class="border p-2 font-medium">{med.nombre_comercial}</td>
            <td class="border p-2">{med.nombre_generico}</td>
            <td class="border p-2">{med.forma_farmaceutica}</td>
            <td class="border p-2">{med.concentracion}</td>
            <td class="border p-2">{med.categoria}</td>
            <td class="border p-2">{med.laboratorio}</td>
            <td class="border p-2 text-right">
              S/ {med.precio_venta?.toFixed(2) ?? "0.00"}
            </td>
            <td class="border p-2">
              {new Date(med.creado_en).toLocaleDateString()}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
