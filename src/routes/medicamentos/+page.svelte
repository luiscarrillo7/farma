<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import IngresoMedicamento from '$lib/components/ingreso-medicamento.svelte';
  import ListarMedicamentos from '$lib/components/listar-medicamentos.svelte';

  let session = $state(null);
  let medicamentos = $state([]);
  let loading = $state(true);
  let refreshKey = $state(0); // Para forzar refresh del componente ListarMedicamentos

  // Obtener sesión
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    if (!session) {
      goto('/login');
    } else {
      cargarMedicamentos();
    }
  });

  async function cargarMedicamentos() {
    loading = true;
    try {
      const response = await fetch('https://farmacia-269414280318.europe-west1.run.app/medicamentos');
      if (response.ok) {
        const data = await response.json();
        medicamentos = data;
      }
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
    } finally {
      loading = false;
    }
  }

  // Handler cuando se agrega un nuevo medicamento
  function handleNuevoMedicamento(event) {
    // Opción 1: Si la API devuelve el medicamento creado, agregarlo a la lista
    if (event.detail) {
      medicamentos = [...medicamentos, event.detail];
    }
    
    // Opción 2: Recargar toda la lista (más seguro)
    cargarMedicamentos();
    
    // Opción 3: Forzar refresh del componente ListarMedicamentos
    refreshKey++;
  }

  // Handler cuando se actualiza un medicamento
  function handleMedicamentoActualizado(event) {
    cargarMedicamentos();
    refreshKey++;
  }

  // Handler cuando se elimina un medicamento
  function handleMedicamentoEliminado(event) {
    const idEliminado = event.detail;
    medicamentos = medicamentos.filter(m => m.id !== idEliminado);
    refreshKey++;
  }

  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }

  function irDashboard() {
    goto('/');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <!-- Header mejorado -->
  <header class="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-4 shadow-2xl">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <div>
          <h1 class="text-2xl font-bold">Inventario de Medicamentos</h1>
          <p class="text-blue-200 text-sm">Gestiona tu catálogo de productos</p>
        </div>
      </div>

      <div class="flex gap-3">
        <button 
          onclick={irDashboard} 
          class="bg-green-500 hover:bg-green-600 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Dashboard
        </button>

        <button 
          onclick={logout} 
          class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
          </svg>
          Salir
        </button>
      </div>
    </div>
  </header>

  <!-- Contenido principal -->
  <main class="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
    {#if session}
      <!-- Sección de estadísticas rápidas (opcional) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Total Medicamentos</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">
                {loading ? '...' : medicamentos.length}
              </p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Stock Disponible</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">
                {loading ? '...' : medicamentos.reduce((sum, m) => sum + (m.stock_actual || 0), 0)}
              </p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Stock Bajo</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">
                {loading ? '...' : medicamentos.filter(m => (m.stock_actual || 0) <= (m.stock_minimo || 0)).length}
              </p>
            </div>
            <div class="bg-yellow-100 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de acciones -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Gestión de Medicamentos</h2>
            <p class="text-gray-600 text-sm mt-1">Administra el inventario de tu farmacia</p>
          </div>
          
          <!-- Componente de agregar medicamento -->
          <IngresoMedicamento 
            on:medicamentoAgregado={handleNuevoMedicamento}
          />
        </div>

        <!-- Separador -->
        <div class="border-t border-gray-200 my-6"></div>

        <!-- Componente de lista de medicamentos -->
        {#if loading}
          <div class="flex justify-center items-center py-12">
            <div class="flex flex-col items-center gap-4">
              <svg class="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-gray-600 font-medium">Cargando medicamentos...</p>
            </div>
          </div>
        {:else}
          <!-- Key reactiva para forzar refresh -->
          {#key refreshKey}
            <ListarMedicamentos 
              {session}
              on:medicamentoActualizado={handleMedicamentoActualizado}
              on:medicamentoEliminado={handleMedicamentoEliminado}
            />
          {/key}
        {/if}
      </div>

    {:else}
      <!-- Mensaje si no hay sesión -->
      <div class="flex justify-center items-center py-20">
        <div class="text-center">
          <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 class="mt-4 text-xl font-semibold text-gray-800">Sesión no iniciada</h3>
          <p class="mt-2 text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    {/if}
  </main>

  <!-- Footer (opcional) -->
  <footer class="bg-white border-t border-gray-200 mt-12 py-6">
    <div class="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
      <p>Sistema de Gestión Farmacéutica © 2024</p>
    </div>
  </footer>
</div>