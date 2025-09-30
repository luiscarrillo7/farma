<script>
  import IngresoMedicamentoModal from '$lib/components/ingreso-medicamento.svelte';
  import ListarLotes from '$lib/components/listar-lotes.svelte';

  let modalAbierto = false;
  let refreshKey = 0;

  function abrirModal() {
    modalAbierto = true;
  }

  function cerrarModal() {
    modalAbierto = false;
  }

  function handleLoteAgregado() {
    // Incrementar la key para forzar el refresh del componente ListarLotes
    refreshKey += 1;
  }
</script>

<!-- Header con botón de agregar en esquina superior derecha -->
<div class="relative">
  <button 
    on:click={abrirModal}
    class="absolute top-4 right-4 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-sm"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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