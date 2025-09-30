<script>
  import { supabase } from '$lib/supabaseClient';
  import { createEventDispatcher, onMount } from 'svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let medicamentos = [];
  let proveedores = [];

  // Datos del formulario
  let medicamentoId = "";
  let proveedorId = "";
  let fechaIngreso = "";
  let fechaVencimiento = "";
  let cantidadInicial = 0;
  let cantidadActual = 0;
  let precioCompra = 0;

  // Cargar combos desde tu API
  onMount(async () => {
    const resMed = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos");
    medicamentos = await resMed.json();

    const resProv = await fetch("https://farmacia-269414280318.europe-west1.run.app/proveedores");
    proveedores = await resProv.json();
  });

  async function agregarLote() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/lotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        medicamento_id: medicamentoId,
        proveedor_id: proveedorId,
        fecha_ingreso: fechaIngreso,
        fecha_vencimiento: fechaVencimiento,
        cantidad_inicial: cantidadInicial,
        cantidad_actual: cantidadActual,
        precio_compra: precioCompra
      })
    });

    if (response.ok) {
      alert("✅ Lote agregado con éxito");
      limpiarFormulario();
      dispatch('loteAgregado'); // Emitir evento para refrescar la lista
      cerrarModal();
    } else {
      const error = await response.json();
      alert("❌ Error: " + (error.detail || "Error al guardar el lote"));
    }
  }

  function limpiarFormulario() {
    medicamentoId = "";
    proveedorId = "";
    fechaIngreso = "";
    fechaVencimiento = "";
    cantidadInicial = 0;
    cantidadActual = 0;
    precioCompra = 0;
  }

  function cerrarModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      cerrarModal();
    }
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header del Modal -->
      <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h2 class="text-2xl font-bold">Agregar Lote</h2>
        <button 
          on:click={cerrarModal}
          class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- Contenido del Modal -->
      <div class="p-6">
        <form on:submit|preventDefault={agregarLote} class="space-y-4">
          <div>
            <label for="medicamento" class="block mb-1 font-semibold">Medicamento</label>
            <select id="medicamento" bind:value={medicamentoId} class="w-full border rounded p-2" required>
              <option value="">-- Seleccione --</option>
              {#each medicamentos as m}
                <option value={m.id}>{m.nombre}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="proveedor" class="block mb-1 font-semibold">Proveedor</label>
            <select id="proveedor" bind:value={proveedorId} class="w-full border rounded p-2" required>
              <option value="">-- Seleccione --</option>
              {#each proveedores as p}
                <option value={p.id}>{p.nombre}</option>
              {/each}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="fechaIngreso" class="block mb-1 font-semibold">Fecha Ingreso</label>
              <input id="fechaIngreso" type="date" bind:value={fechaIngreso} class="w-full border rounded p-2" required />
            </div>
            <div>
              <label for="fechaVencimiento" class="block mb-1 font-semibold">Fecha Vencimiento</label>
              <input id="fechaVencimiento" type="date" bind:value={fechaVencimiento} class="w-full border rounded p-2" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="cantidadInicial" class="block mb-1 font-semibold">Cantidad Inicial</label>
              <input id="cantidadInicial" type="number" bind:value={cantidadInicial} class="w-full border rounded p-2" required />
            </div>
            <div>
              <label for="cantidadActual" class="block mb-1 font-semibold">Cantidad Actual</label>
              <input id="cantidadActual" type="number" bind:value={cantidadActual} class="w-full border rounded p-2" required />
            </div>
          </div>

          <div>
            <label for="precioCompra" class="block mb-1 font-semibold">Precio Compra</label>
            <input id="precioCompra" type="number" step="0.01" bind:value={precioCompra} class="w-full border rounded p-2" required />
          </div>

          <!-- Botones del Modal -->
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button"
              on:click={cerrarModal}
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Guardar Lote
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}