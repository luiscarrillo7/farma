<script>
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();

  export let medicamentoId = null;
  export let show = false;
  export let token = "";

  let lotes = [];
  let isLoading = false;
  const API_URL = "https://farmacia-269414280318.europe-west1.run.app";

  onMount(() => {
    if (show && medicamentoId) loadLotes();
  });

  $: if (show && medicamentoId) loadLotes();

  async function loadLotes() {
    if (!medicamentoId) return;
    isLoading = true;
    try {
      const res = await fetch(`${API_URL}/lotes?medicamento_id=${medicamentoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      lotes = await res.json();
    } catch (err) {
      console.error("Error cargando lotes", err);
    } finally {
      isLoading = false;
    }
  }

  function seleccionarLote(lote) {
    dispatch("select", lote);
    show = false;
  }

  function cerrar() {
    dispatch("close");
    show = false;
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-96 p-5">
      <h2 class="text-lg font-bold mb-4 text-center">Seleccionar Lote</h2>
      {#if isLoading}
        <p class="text-center text-gray-500">Cargando lotes...</p>
      {:else if lotes.length === 0}
        <p class="text-center text-gray-500">No hay lotes disponibles.</p>
      {:else}
        <ul class="divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {#each lotes as lote}

            <li>
  <button
    type="button"
    class="w-full text-left p-2 hover:bg-blue-100 rounded cursor-pointer"
    on:click={() => seleccionarLote(lote)}
  >
    <div class="flex justify-between">
      <span class="font-semibold">Lote #{lote.id}</span>
      <span class="text-sm text-gray-600">Stock: {lote.stock}</span>
    </div>
    <p class="text-xs text-gray-500">
      Vence: {lote.fecha_vencimiento}
    </p>
  </button>
        </li>

          {/each}
        </ul>
      {/if}
      <div class="mt-4 flex justify-end">
        <button
          class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
          on:click={cerrar}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
{/if}
