<script>
  import { onMount } from 'svelte';

  // Se asume que la sesión se pasará como prop desde la página principal
  export let session;

  let open = false;

  // Datos del formulario para un nuevo medicamento
  let nombre = "";
  let descripcion = "";
  let presentacion = "";
  let precioCompra = null;
  let precioVenta = null;
  let stockMinimo = 0;
  let requiereReceta = false;

  function resetForm() {
    nombre = "";
    descripcion = "";
    presentacion = "";
    precioCompra = null;
    precioVenta = null;
    stockMinimo = 0;
    requiereReceta = false;
  }

  function close() {
    open = false;
    resetForm();
  }

  async function agregarMedicamento(event) {
    event.preventDefault();

    if (!nombre || !precioCompra || !precioVenta) {
      alert("Por favor, complete los campos obligatorios: Nombre, Precio de Compra y Precio de Venta.");
      return;
    }

    const token = session?.access_token;
    if (!token) {
        alert("Error de autenticación. No se pudo obtener el token.");
        return;
    }

    const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: nombre,
        descripcion: descripcion,
        presentacion: presentacion,
        precioCompra: precioCompra,
        precioVenta: precioVenta,
        stockMinimo: stockMinimo,
        requiereReceta: requiereReceta
      })
    });

    if (response.ok) {
      alert("✅ Medicamento agregado con éxito");
      close();
      location.reload(); // Recarga la página para mostrar el nuevo medicamento en la lista
    } else {
      const error = await response.json();
      alert("❌ Error: " + (error.detail || "Error al guardar el medicamento"));
    }
  }
</script>

<svelte:head>
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 9999;
    }
    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    .modal-content {
      position: relative;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 36rem; /* 576px */
      max-height: 90vh;
      overflow: hidden;
    }
  </style>
</svelte:head>

<!-- Botón para abrir el modal -->
<button
  on:click={() => (open = true)}
  class="bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition duration-200"
>
  + Agregar Medicamento
</button>

{#if open}
  <div class="modal-overlay">
    <div 
      class="modal-backdrop"
      on:click={close}
      on:keydown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') close() }}
      role="button"
      tabindex="-1"
    ></div>
    
    <div class="modal-content">
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-xl font-bold text-gray-800">Registrar Nuevo Medicamento</h2>
        <button on:click={close} aria-label="Cerrar" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit={agregarMedicamento} class="p-6 space-y-4 overflow-y-auto" style="max-height: calc(90vh - 65px);">
        
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre del Medicamento</label>
          <input id="nombre" type="text" required bind:value={nombre} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Paracetamol 500mg" />
        </div>

        <div>
            <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea id="descripcion" rows="3" bind:value={descripcion} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Analgésico y antipirético"></textarea>
        </div>

        <div>
            <label for="presentacion" class="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
            <input id="presentacion" type="text" bind:value={presentacion} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Caja de 20 tabletas" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label for="precioCompra" class="block text-sm font-medium text-gray-700 mb-1">Precio Compra (S/)</label>
                <input id="precioCompra" type="number" step="0.01" min="0" required bind:value={precioCompra} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: 10.50" />
            </div>
            <div>
                <label for="precioVenta" class="block text-sm font-medium text-gray-700 mb-1">Precio Venta (S/)</label>
                <input id="precioVenta" type="number" step="0.01" min="0" required bind:value={precioVenta} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: 15.00" />
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
                <label for="stockMinimo" class="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <input id="stockMinimo" type="number" min="0" required bind:value={stockMinimo} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: 10" />
            </div>
            <div class="pt-6">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" bind:checked={requiereReceta} class="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50" />
                    Requiere Receta Médica
                </label>
            </div>
        </div>
        
        <div class="flex justify-end gap-4 pt-4 mt-4 border-t">
          <button type="button" on:click={close} class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">
            Cancelar
          </button>
          <button type="submit" class="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 font-semibold">
            Guardar Medicamento
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

