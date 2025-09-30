<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let showModal = false;

  // Campos del formulario
  let medicamento_id = "";
  let proveedor_id = "";
  let fecha_ingreso = "";
  let fecha_vencimiento = "";
  let cantidad_inicial = "";
  let cantidad_actual = "";
  let precio_compra = "";

  async function guardarLote() {
    try {
      const res = await fetch("https://farmacia-269414280318.europe-west1.run.app/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicamento_id,
          proveedor_id,
          fecha_ingreso,
          fecha_vencimiento,
          cantidad_inicial: Number(cantidad_inicial),
          cantidad_actual: Number(cantidad_actual),
          precio_compra: Number(precio_compra)
        })
      });

      if (!res.ok) throw new Error("Error al guardar el lote");

      dispatch("loteAgregado"); // notificar al padre para refrescar la lista
      resetForm();
      showModal = false;
      alert("✅ Lote agregado con éxito");
    } catch (err) {
      alert("❌ " + err.message);
    }
  }

  function resetForm() {
    medicamento_id = "";
    proveedor_id = "";
    fecha_ingreso = "";
    fecha_vencimiento = "";
    cantidad_inicial = "";
    cantidad_actual = "";
    precio_compra = "";
  }
</script>

<!-- Botón que abre el modal -->
<button
  on:click={() => (showModal = true)}
  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
>
  ➕ Agregar Lote
</button>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
      <h2 class="text-xl font-bold mb-4">Agregar Nuevo Lote</h2>

      <form on:submit|preventDefault={guardarLote} class="space-y-3">
        <input type="text" bind:value={medicamento_id} placeholder="ID Medicamento" class="w-full border p-2 rounded" required />
        <input type="text" bind:value={proveedor_id} placeholder="ID Proveedor" class="w-full border p-2 rounded" required />
        <input type="date" bind:value={fecha_ingreso} class="w-full border p-2 rounded" required />
        <input type="date" bind:value={fecha_vencimiento} class="w-full border p-2 rounded" required />
        <input type="number" bind:value={cantidad_inicial} placeholder="Cantidad Inicial" class="w-full border p-2 rounded" required />
        <input type="number" bind:value={cantidad_actual} placeholder="Cantidad Actual" class="w-full border p-2 rounded" required />
        <input type="number" step="0.01" bind:value={precio_compra} placeholder="Precio Compra" class="w-full border p-2 rounded" required />

        <div class="flex justify-end gap-3 mt-4">
          <button type="button" on:click={() => (showModal = false)} class="px-4 py-2 bg-gray-400 rounded-lg hover:bg-gray-500">
            Cancelar
          </button>
          <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Guardar
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
