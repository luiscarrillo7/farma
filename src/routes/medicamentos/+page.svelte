<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import IngresoMedicamento from '$lib/components/modal-ingreso-medicamento.svelte';
  import ListarMedicamentos from '$lib/components/listar-medicamentos.svelte';

  let session = $state(null);
  let medicamentos = $state([]);
  let loading = $state(true);

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
        console.log('Medicamentos cargados desde API:', data); // Para debug
      }
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
    } finally {
      loading = false;
    }
  }

  // Handler cuando se agrega un nuevo medicamento
  function handleNuevoMedicamento(event) {
    // Recargar toda la lista
    cargarMedicamentos();
  }

  // Handler cuando se actualiza un medicamento
  function handleMedicamentoActualizado(event) {
    cargarMedicamentos();
  }

  // Handler cuando se elimina un medicamento
  function handleMedicamentoEliminado(event) {
    const idEliminado = event.detail;
    medicamentos = medicamentos.filter(m => m.id !== idEliminado);
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
 
    <header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">Medicamentos</h1>

    <div class="flex gap-4">
      <button 
        onclick={irDashboard} 
        class="bg-green-500 hover:bg-green-600 font-semibold py-2 px-4 rounded-lg">
        Dashboard
      </button>

      <button 
        onclick={logout} 
        class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">
        Salir
      </button>
    </div>
  </header>
  <!-- Contenido principal -->
  <main class="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
    {#if session}
      <!-- Sección de estadísticas rápidas -->

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
          <!-- CAMBIO IMPORTANTE: Pasar medicamentos como prop -->
          <ListarMedicamentos 
            {session}
            {medicamentos}
            on:medicamentoActualizado={handleMedicamentoActualizado}
            on:medicamentoEliminado={handleMedicamentoEliminado}
          />
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

  <!-- Footer -->
  <footer class="bg-white border-t border-gray-200 mt-12 py-6">
    <div class="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
      <p>Sistema de Gestión Farmacéutica © 2024</p>
    </div>
  </footer>
</div>