
<script>
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  const dispatch = createEventDispatcher();

  let open = false;
  let loading = false;

  // Datos del formulario
  let nombre = "";
  let descripcion = "";
  let presentacion = "";
  let precioCompra = null;
  let precioVenta = null;
  let stockMinimo = 0;
  let requiereReceta = false;

  // Estados de validación
  let errorMessage = "";
  let showToast = false;
  let toastMessage = "";
  let toastType = "success"; // "success" | "error"

  // Validación reactiva de precios
  $: precioValido = precioVenta > precioCompra;
  $: margen = precioVenta && precioCompra && precioCompra > 0
    ? ((precioVenta - precioCompra) / precioCompra * 100).toFixed(2)
    : 0;

  function resetForm() {
    nombre = "";
    descripcion = "";
    presentacion = "";
    precioCompra = null;
    precioVenta = null;
    stockMinimo = 0;
    requiereReceta = false;
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

    // Validaciones del lado del cliente
    if (!nombre || !precioCompra || !precioVenta) {
      errorMessage = "Por favor, complete los campos obligatorios: Nombre, Precio de Compra y Precio de Venta.";
      return;
    }

    if (precioCompra <= 0 || precioVenta <= 0) {
      errorMessage = "Los precios deben ser mayores a 0";
      return;
    }

    if (precioVenta <= precioCompra) {
      errorMessage = "El precio de venta debe ser mayor al precio de compra";
      return;
    }

    if (nombre.length > 100) {
      errorMessage = "El nombre no puede exceder 100 caracteres";
      return;
    }

    if (presentacion && presentacion.length > 50) {
      errorMessage = "La presentación no puede exceder 50 caracteres";
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

      // Realizar petición a la API
      const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          presentacion: presentacion?.trim() || null,
          precioCompra: parseFloat(precioCompra),
          precioVenta: parseFloat(precioVenta),
          stockMinimo: parseInt(stockMinimo) || 0,
          requiereReceta: requiereReceta
        })
      });

      if (response.ok) {
        // Parsear la respuesta
        const textResponse = await response.text();
        let newMedicamento = null;
        
        try {
          if (textResponse) {
            const parsed = JSON.parse(textResponse);
            // Si es un array, tomar el primer elemento
            newMedicamento = Array.isArray(parsed) ? parsed[0] : parsed;
          }
        } catch (e) {
          console.log("Respuesta no JSON, pero operación exitosa");
        }

        showToastMessage("✅ Medicamento agregado con éxito", "success");
        
        // Emitir evento para actualizar la lista sin recargar
        dispatch('medicamentoAgregado', newMedicamento);
        
        close();
      } else {
        // Manejo de errores del servidor
        const textResponse = await response.text();
        try {
          const error = JSON.parse(textResponse);
          errorMessage = error.detail || error.title || "Error al guardar el medicamento";
        } catch (e) {
          errorMessage = `Error del servidor (código ${response.status}): ${textResponse || "Sin detalles adicionales."}`;
        }
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      errorMessage = "Error de conexión. Verifique su conexión a internet e intente nuevamente.";
    } finally {
      loading = false;
    }
  }

  // Cerrar con tecla Escape
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

<!-- Toast de notificaciones -->
{#if showToast}
  <div class="toast {toastType}">
    <p class="font-semibold">{toastMessage}</p>
  </div>
{/if}

<!-- Botón para abrir el modal -->
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
        
        <!-- Mensaje de error global -->
        {#if errorMessage}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm">{errorMessage}</span>
          </div>
        {/if}

        <!-- Nombre del Medicamento -->
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Medicamento <span class="text-red-500">*</span>
          </label>
          <input 
            id="nombre" 
            type="text" 
            required 
            maxlength="100"
            bind:value={nombre} 
            disabled={loading}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
            placeholder="Ej: Paracetamol 500mg" 
          />
          <p class="text-xs text-gray-500 mt-1">{nombre.length}/100 caracteres</p>
        </div>

        <!-- Descripción -->
        <div>
          <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea 
            id="descripcion" 
            rows="3" 
            bind:value={descripcion} 
            disabled={loading}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
            placeholder="Ej: Analgésico y antipirético para el alivio del dolor y fiebre"
          ></textarea>
        </div>

        <!-- Presentación -->
        <div>
          <label for="presentacion" class="block text-sm font-medium text-gray-700 mb-1">
            Presentación
          </label>
          <input 
            id="presentacion" 
            type="text" 
            maxlength="50"
            bind:value={presentacion} 
            disabled={loading}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
            placeholder="Ej: Caja de 20 tabletas" 
          />
          {#if presentacion}
            <p class="text-xs text-gray-500 mt-1">{presentacion.length}/50 caracteres</p>
          {/if}
        </div>

        <!-- Precios -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="precioCompra" class="block text-sm font-medium text-gray-700 mb-1">
              Precio Compra (S/) <span class="text-red-500">*</span>
            </label>
            <input 
              id="precioCompra" 
              type="number" 
              step="0.01" 
              min="0.01" 
              required 
              bind:value={precioCompra} 
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="10.50" 
            />
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="15.00" 
            />
          </div>
        </div>

        <!-- Indicador de margen de ganancia -->
        {#if precioCompra && precioVenta && precioCompra > 0}
          <div class="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Margen de ganancia:</span>
              <span class="text-lg font-bold {precioValido ? 'text-green-600' : 'text-red-600'}">
                {#if precioValido}
                  +{margen}%
                {:else}
                  ⚠️ Precio inválido
                {/if}
              </span>
            </div>
            {#if !precioValido}
              <p class="text-xs text-red-600 mt-1">El precio de venta debe ser mayor al de compra</p>
            {/if}
          </div>
        {/if}
        
        <!-- Stock Mínimo y Requiere Receta -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label for="stockMinimo" class="block text-sm font-medium text-gray-700 mb-1">
              Stock Mínimo
            </label>
            <input 
              id="stockMinimo" 
              type="number" 
              min="0" 
              bind:value={stockMinimo} 
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="10" 
            />
            <p class="text-xs text-gray-500 mt-1">Nivel de alerta para reabastecimiento</p>
          </div>
          <div class="pt-6">
            <label class="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                bind:checked={requiereReceta} 
                disabled={loading}
                class="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              <span>Requiere Receta Médica</span>
            </label>
          </div>
        </div>
        
        <!-- Botones de acción -->
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
            disabled={loading || !precioValido}
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