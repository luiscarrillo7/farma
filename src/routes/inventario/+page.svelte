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

<div class="p-8">
  <!-- Header con botón de agregar -->
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Inventario de Medicamentos</h1>
    <button 
      on:click={abrirModal}
      class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
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
</div>

<!-- Modal -->
<IngresoMedicamentoModal 
  bind:isOpen={modalAbierto}
  on:close={cerrarModal}
  on:loteAgregado={handleLoteAgregado}
/>