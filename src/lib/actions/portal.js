<script>
  import { supabase } from '$lib/supabaseClient';
  // 1. IMPORTA LA NUEVA ACCIÓN 'portal'
  import { portal } from '$lib/actions/portal.js';

  let { session } = $props();

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let open = $state(false);
  let medicamentos = $state([]);
  let clientes = $state([]);
  let items = $state([]);
  let clienteId = $state('');
  let isLoading = $state(false);

  // ... (El resto de tu script no necesita ningún cambio)
  let totalGeneral = $derived(/*...*/);
  async function loadData() {/*...*/}
  function addItem() {/*...*/}
  function removeItem(id) {/*...*/}
  function updateItem(id, field, value) {/*...*/}
  function getSubtotal(item) {/*...*/}
  function getPrecio(medicamentoId) {/*...*/}
  async function submitVenta(e) {/*...*/}
  function openModal() {
    open = true;
    items = [];
    clienteId = '';
    loadData();
  }
  function close() {
    open = false;
    items = [];
    clienteId = '';
  }
</script>

<div class="text-center">
  <button 
    onclick={openModal}
    class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl"
  >
    🛒 Registrar Nueva Venta
  </button>
</div>

{#if open}
  <div use:portal class="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-50">
    <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-blue-700">Registrar Venta</h3>
        <button 
          onclick={close}
          disabled={isLoading}
          class="text-gray-500 text-3xl hover:text-gray-800 disabled:opacity-50"
        >
          &times;
        </button>
      </div>
      <form onsubmit={submitVenta} class="space-y-4">
        </form>
    </div>
  </div>
{/if}