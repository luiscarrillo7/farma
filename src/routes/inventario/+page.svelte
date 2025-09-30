<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import IngresoMedicamentoModal from '$lib/components/ingreso-medicamento-modal.svelte';
  import ListarLotes from '$lib/components/listar-lotes.svelte';

  let session = $state(null);
  let refreshKey = $state(0);
  let modalRef;

  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    if (!session) goto('/login');
  });

  function abrirModal() {
    modalRef?.openModal();
  }

  function handleLoteAgregado() {
    // Incrementar la key para forzar el refresh del componente ListarLotes
    refreshKey += 1;
  }

  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }

  function volverDashboard() {
    goto('/');
  }
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">Inventario de Medicamentos</h1>

    <div class="flex gap-4">
      <button 
        onclick={volverDashboard} 
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

  <main class="p-8 space-y-8">
    {#if session}
      <!-- Botón Agregar Lote -->
      <div class="text-center">
        <button 
          onclick={abrirModal}
          class="bg-white border border-gray-300 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg inline-flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Agregar Lote
        </button>
      </div>

      <!-- Lista de lotes -->
      {#key refreshKey}
        <ListarLotes />
      {/key}

      <!-- Modal -->
      <IngresoMedicamentoModal 
        bind:isOpen={modalAbierto}
        on:close={cerrarModal}
        on:loteAgregado={handleLoteAgregado}
      />
    {/if}
  </main>
</div>