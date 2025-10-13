<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  export let medicamentoId;
  const dispatch = createEventDispatcher();
  let lotes = [];
  let isLoading = false;

  onMount(() => {
    loadLotes();
  });

  async function loadLotes() {
    try {
      isLoading = true;
      const { data, error } = await supabase
        .from('lotes')
        .select('*')
        .eq('medicamento_id', medicamentoId)
        .gt('cantidad_actual', 0)
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;
      lotes = data;
    } catch (e) {
      console.error(e);
      alert('Error al cargar lotes');
    } finally {
      isLoading = false;
    }
  }

  function seleccionarLote(lote) {
    dispatch('select', lote);
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
  <div class="bg-white rounded-lg shadow-lg w-96 p-5">
    <h2 class="text-xl font-semibold mb-4 text-gray-800">Seleccionar Lote</h2>

    {#if isLoading}
      <p class="text-center text-gray-500">Cargando...</p>
    {:else if lotes.length === 0}
      <p class="text-center text-gray-500">No hay lotes disponibles.</p>
    {:else}
      <ul class="space-y-2">
       {#each lotes as lote}
  <button
    type="button"
    class="w-full text-left border rounded p-2 hover:bg-blue-50 cursor-pointer"
    on:click={() => seleccionarLote(lote)}
  >
    <div class="font-semibold text-gray-800">
      Lote #{lote.id} - {lote.codigo}
    </div>
    <div class="text-sm text-gray-600">
      Stock: {lote.cantidad_actual} | Vence: {lote.fecha_vencimiento}
    </div>
  </button>
{/each}

      </ul>
    {/if}

    <button
      class="mt-4 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full"
      on:click={() => dispatch('close')}
    >
      Cerrar
    </button>
  </div>
</div>
