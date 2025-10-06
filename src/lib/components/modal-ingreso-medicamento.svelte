<script>
  import { onMount } from 'svelte';

  let open = false;

  // Variables alineadas con lo que espera el backend
  let nombreComercial = "";
  let nombreGenerico = "";
  let concentracion = "";
  let formaFarmaceutica = "";
  let categoria = "";
  let laboratorio = "";
  let precioVenta = null;

  function resetForm() {
    nombreComercial = "";
    nombreGenerico = "";
    concentracion = "";
    formaFarmaceutica = "";
    categoria = "";
    laboratorio = "";
    precioVenta = null;
  }

  function close() {
    open = false;
    resetForm();
  }

  async function agregarMedicamento(event) {
    event.preventDefault();

    if (!nombreComercial || !precioVenta) {
      alert("Por favor, complete los campos obligatorios: Nombre Comercial y Precio de Venta.");
      return;
    }

    const payload = {
      nombreComercial,
      nombreGenerico,
      concentracion,
      formaFarmaceutica,
      categoria,
      laboratorio,
      precioVenta: parseFloat(precioVenta)
    };

    console.log("📤 Enviando a API:", payload);

    const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert("✅ Medicamento agregado con éxito");
      close();
      location.reload();
    } else {
      const textResponse = await response.text();
      try {
        const error = JSON.parse(textResponse);
        alert("❌ Error: " + (error.detail || error.error || "Error al guardar el medicamento"));
      } catch {
        alert(`❌ Error del servidor (${response.status}): ${textResponse || "Sin detalles."}`);
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial <span class="text-red-500">*</span></label>
          <input type="text" required bind:value={nombreComercial} placeholder="Ej: Paracetamol" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Genérico</label>
          <input type="text" bind:value={nombreGenerico} placeholder="Ej: Paracetamol Genérico" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Concentración</label>
            <input type="text" bind:value={concentracion} placeholder="Ej: 500mg" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Forma Farmacéutica</label>
            <input type="text" bind:value={formaFarmaceutica} placeholder="Ej: Tableta" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input type="text" bind:value={categoria} placeholder="Ej: Analgésico" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input type="text" bind:value={laboratorio} placeholder="Ej: Maver" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Precio Venta (S/)</label>
          <input type="number" step="0.01" min="0" required bind:value={precioVenta} placeholder="Ej: 15.00" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500" />
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
