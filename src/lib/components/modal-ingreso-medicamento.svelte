<script>
  let open = false;

  // Campos del formulario adaptados a la nueva estructura de tu API
  let nombre_comercial = "";
  let nombre_generico = "";
  let forma_farmaceutica = "";
  let concentracion = "";
  let categoria = "";
  let laboratorio = "";
  let precio_venta = null;

  function resetForm() {
    nombre_comercial = "";
    nombre_generico = "";
    forma_farmaceutica = "";
    concentracion = "";
    categoria = "";
    laboratorio = "";
    precio_venta = null;
  }

  function close() {
    open = false;
    resetForm();
  }

  async function agregarMedicamento(event) {
    event.preventDefault();

    if (!nombre_comercial || !precio_venta) {
      alert("Por favor, complete los campos obligatorios: Nombre comercial y Precio de venta.");
      return;
    }

const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nombreComercial: nombre,
    nombreGenerico: "", // Puedes agregar campo real si lo tienes en el formulario
    concentracion: concentracion,
    formaFarmaceutica: presentacion,
    categoria: categoria,
    laboratorio: codigoComercial, // o cámbialo si tienes un campo de laboratorio real
    precioVenta: parseFloat(precioVenta)
  })
});


    if (response.ok) {
      alert("✅ Medicamento agregado con éxito");
      close();
      location.reload();
    } else {
      const textResponse = await response.text();
      try {
        const error = JSON.parse(textResponse);
        alert("❌ Error: " + (error.detail || "Error al guardar el medicamento"));
      } catch (e) {
        alert(`❌ Error del servidor (código ${response.status}): ${textResponse || "Sin detalles adicionales."}`);
      }
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
      max-width: 36rem;
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
          <label for="nombre_comercial" class="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial <span class="text-red-500">*</span></label>
          <input id="nombre_comercial" type="text" required bind:value={nombre_comercial} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Amoxicilina" />
        </div>

        <div>
          <label for="nombre_generico" class="block text-sm font-medium text-gray-700 mb-1">Nombre Genérico</label>
          <input id="nombre_generico" type="text" bind:value={nombre_generico} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Amoxicilina base" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="forma_farmaceutica" class="block text-sm font-medium text-gray-700 mb-1">Forma Farmacéutica</label>
            <input id="forma_farmaceutica" type="text" bind:value={forma_farmaceutica} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Cápsula" />
          </div>
          <div>
            <label for="concentracion" class="block text-sm font-medium text-gray-700 mb-1">Concentración</label>
            <input id="concentracion" type="text" bind:value={concentracion} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: 250mg" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="categoria" class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input id="categoria" type="text" bind:value={categoria} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Antibiótico" />
          </div>
          <div>
            <label for="laboratorio" class="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input id="laboratorio" type="text" bind:value={laboratorio} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Maver" />
          </div>
        </div>

        <div>
          <label for="precio_venta" class="block text-sm font-medium text-gray-700 mb-1">Precio Venta (S/)<span class="text-red-500">*</span></label>
          <input id="precio_venta" type="number" step="0.01" min="0" required bind:value={precio_venta} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: 12.50" />
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
