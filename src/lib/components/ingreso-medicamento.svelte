<script>
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  const dispatch = createEventDispatcher();

  let open = false;
  let loading = false;

  // Datos del formulario adaptados a tu tabla actual
  let nombre = "";
  let codigoComercial = "";
  let presentacion = "";
  let concentracion = "";
  let categoria = "";
  let precioVenta = null;

  let errorMessage = "";
  let showToast = false;
  let toastMessage = "";
  let toastType = "success";

  // Categorías comunes
  const categorias = [
    "Analgésico",
    "Antibiótico",
    "Antiinflamatorio",
    "Antihistamínico",
    "Antihipertensivo",
    "Vitaminas",
    "Otros"
  ];

  function resetForm() {
    nombre = "";
    codigoComercial = "";
    presentacion = "";
    concentracion = "";
    categoria = "";
    precioVenta = null;
    errorMessage = "";
  }

  function close() {
    if (!loading) {
      open = false;
      resetForm();
    }
  }

  function showToastMessage(message, type = "success") {
    toastMessage = message;
    toastType = type;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 3000);
  }

  async function agregarMedicamento(event) {
    event.preventDefault();
    errorMessage = "";

    // Validaciones
    if (!nombre || !precioVenta) {
      errorMessage = "El nombre y precio de venta son obligatorios";
      return;
    }

    if (precioVenta <= 0) {
      errorMessage = "El precio debe ser mayor a 0";
      return;
    }

    loading = true;

    try {
      // Obtener sesión actualizada
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();

      if (sessionError || !currentSession) {
        errorMessage = "Error de autenticación. Por favor, inicie sesión nuevamente.";
        loading = false;
        return;
      }

      const token = currentSession.access_token;

      // Insertar directamente en Supabase (más confiable que tu API para este caso)
      const { data, error } = await supabase
        .from('medicamentos')
        .insert([
          {
            nombre: nombre.trim(),
            codigo_comercial: codigoComercial?.trim() || null,
            presentacion: presentacion?.trim() || null,
            concentracion: concentracion?.trim() || null,
            categoria: categoria || null,
            precio_venta: parseFloat(precioVenta)
          }
        ])
        .select();

      if (error) {
        console.error('Error de Supabase:', error);
        errorMessage = error.message || "Error al guardar el medicamento";
      } else {
        showToastMessage("✅ Medicamento agregado con éxito", "success");
        dispatch('medicamentoAgregado', data[0]);
        close();
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      errorMessage = "Error de conexión. Verifique su conexión a internet.";
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && open && !loading) {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

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
    .toast {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .toast.success {
      background-color: #10b981;
      color: white;
    }
    .toast.error {
      background-color: #ef4444;
      color: white;
    }
  </style>
</svelte:head>

<!-- Toast -->
{#if showToast}
  <div class="toast {toastType}">
    <p class="font-semibold">{toastMessage}</p>
  </div>
{/if}

<!-- Botón -->
<button
  on:click={() => (open = true)}
  class="bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition duration-200 flex items-center gap-2"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
  </svg>
  Agregar Medicamento
</button>

{#if open}
  <div class="modal-overlay">
    <div 
      class="modal-backdrop"
      on:click={close}
      on:keydown={(e) => { if (e.key === 'Enter') close() }}
      role="button"
      tabindex="-1"
      aria-label="Cerrar modal"
    ></div>
    
    <div class="modal-content">
      <div class="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-50 to-purple-100">
        <div>
          <h2 class="text-xl font-bold text-gray-800">Registrar Nuevo Medicamento</h2>
          <p class="text-sm text-gray-600">Complete la información del medicamento</p>
        </div>
        <button 
          on:click={close} 
          disabled={loading}
          aria-label="Cerrar" 
          class="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit={agregarMedicamento} class="p-6 space-y-4 overflow-y-auto" style="max-height: calc(90vh - 130px);">
        
        <!-- Error message -->
        {#if errorMessage}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm">{errorMessage}</span>
          </div>
        {/if}

        <!-- Nombre -->
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Medicamento <span class="text-red-500">*</span>
          </label>
          <input 
            id="nombre" 
            type="text" 
            required 
            bind:value={nombre} 
            disabled={loading}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" 
            placeholder="Ej: Paracetamol" 
          />
        </div>

        <!-- Código Comercial y Concentración -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="codigoComercial" class="block text-sm font-medium text-gray-700 mb-1">
              Código Comercial
            </label>
            <input 
              id="codigoComercial" 
              type="text" 
              bind:value={codigoComercial} 
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" 
              placeholder="Ej: MED-001" 
            />
          </div>

          <div>
            <label for="concentracion" class="block text-sm font-medium text-gray-700 mb-1">
              Concentración
            </label>
            <input 
              id="concentracion" 
              type="text" 
              bind:value={concentracion} 
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" 
              placeholder="Ej: 500mg" 
            />
          </div>
        </div>

        <!-- Presentación -->
        <div>
          <label for="presentacion" class="block text-sm font-medium text-gray-700 mb-1">
            Presentación
          </label>
          <input 
            id="presentacion" 
            type="text" 
            bind:value={presentacion} 
            disabled={loading}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" 
            placeholder="Ej: Tableta, Cápsula, Jarabe" 
          />
        </div>

        <!-- Categoría y Precio -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="categoria" class="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select 
              id="categoria" 
              bind:value={categoria} 
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
            >
              <option value="">Seleccione una categoría</option>
              {#each categorias as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="precioVenta" class="block text-sm font-medium text-gray-700 mb-1">
              Precio Venta (S/) <span class="text-red-500">*</span>
            </label>
            <input 
              id="precioVenta" 
              type="number" 
              step="0.01" 
              min="0.01" 
              required 
              bind:value={precioVenta} 
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" 
              placeholder="15.00" 
            />
          </div>
        </div>
        
        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button 
            type="button" 
            on:click={close} 
            disabled={loading}
            class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            class="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {#if loading}
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Guardar Medicamento
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}