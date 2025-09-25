<script>
  export let open = false;
  export let onClose;

  function close() {
    if (onClose) onClose();
  }
</script>

{#if open}
  <div class="fixed inset-0 flex items-center justify-center p-4 bg-black/50">
    <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-blue-700">Registrar Venta</h3>
        <button on:click={close} class="text-gray-500 text-3xl hover:text-gray-800">&times;</button>
      </div>
      <div>
        <!-- Aquí luego migramos el formulario dinámico -->
        <p>Formulario de venta en construcción 🚧</p>
      </div>
    </div>
  </div>
{/if}
