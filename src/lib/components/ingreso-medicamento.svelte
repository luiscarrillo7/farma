<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  export let session;

  let open = false;
  let medicamentos = [];
  let proveedores = [];

  // Datos del formulario
  let medicamentoId = "";
  let proveedorId = "";
  let fechaIngreso = new Date().toISOString().split('T')[0];
  let fechaVencimiento = "";
  let cantidadInicial = null;
  let precioCompra = null;

  onMount(async () => {
    try {
      const resMed = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos");
      if (resMed.ok) medicamentos = await resMed.json();

      const resProv = await fetch("https://farmacia-269414280318.europe-west1.run.app/proveedores");
      if (resProv.ok) proveedores = await resProv.json();
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      alert("No se pudieron cargar los medicamentos o proveedores. Revisa la conexión.");
    }
  });

  // La función ahora acepta el 'event' para poder usar event.preventDefault()
  async function agregarLote(event) {
    event.preventDefault(); // Evita que la página se recargue al enviar el formulario

    // Validación simple
    if (!medicamentoId || !proveedorId || !fechaIngreso || !fechaVencimiento || !cantidadInicial || !precioCompra) {
        alert("Por favor, complete todos los campos obligatorios.");
        return;
    }

    const token = session?.access_token;
    const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/lotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        medicamento_id: parseInt(medicamentoId),
        proveedor_id: parseInt(proveedorId),
        fecha_ingreso: fechaIngreso,
        fecha_vencimiento: fechaVencimiento,
        cantidad_inicial: cantidadInicial,
        cantidad_actual: cantidadInicial, 
        precio_compra: precioCompra
      })
    });

    if (response.ok) {
      alert("✅ Lote agregado con éxito");
      close();
      location.reload(); 
    } else {
      const error = await response.json();
      alert("❌ Error: " + (error.detail || "Error al guardar el lote"));
    }
  }

  function resetForm() {
    medicamentoId = "";
    proveedorId = "";
    fechaIngreso = new Date().toISOString().split('T')[0];
    fechaVencimiento = "";
    cantidadInicial = null;
    precioCompra = null;
  }

  function close() {
    open = false;
    resetForm();
  }
</script>

<!-- Botón para abrir modal. CORREGIDO: on:click -->
<button
  on:click={() => (open = true)}
  class="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition duration-200"
>
  Agregar Lote
</button>

<!-- Modal -->
{#if open}
  <!-- CONTENEDOR PRINCIPAL DEL MODAL: Se cambió z-50 por un z-index más alto para asegurar que esté al frente -->
  <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style="z-index: 9999;">
    
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
      
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-xl font-bold text-gray-800">Agregar Nuevo Lote</h2>
        <!-- Botón de cierre. CORREGIDO: se añadió aria-label para accesibilidad -->
        <button on:click={close} aria-label="Cerrar" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Formulario. CORREGIDO: sin modificadores, la lógica está en el script -->
      <form on:submit={agregarLote} class="p-6 space-y-4">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="medicamento" class="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
            <select id="medicamento" required bind:value={medicamentoId} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option disabled value="">-- Seleccione --</option>
              {#each medicamentos as m}
                <option value={m.id}>{m.nombre}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <select id="proveedor" required bind:value={proveedorId} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option disabled value="">-- Seleccione --</option>
              {#each proveedores as p}
                <option value={p.id}>{p.nombre}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="fechaIngreso" class="block text-sm font-medium text-gray-700 mb-1">Fecha Ingreso</label>
            <input id="fechaIngreso" required type="date" bind:value={fechaIngreso} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label for="fechaVencimiento" class="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
            <input id="fechaVencimiento" required type="date" bind:value={fechaVencimiento} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="cantidadInicial" class="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial</label>
            <input id="cantidadInicial" required type="number" min="1" placeholder="Ej: 100" bind:value={cantidadInicial} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label for="precioCompra" class="block text-sm font-medium text-gray-700 mb-1">Precio Compra (S/)</label>
            <input id="precioCompra" required type="number" step="0.01" min="0" placeholder="Ej: 15.50" bind:value={precioCompra} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        
        <div class="flex justify-end gap-4 pt-4 mt-4 border-t">
          <button type="button" on:click={close} class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">
            Cancelar
          </button>
          <button type="submit" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">
            Guardar Lote
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
