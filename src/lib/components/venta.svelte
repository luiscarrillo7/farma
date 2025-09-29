```svelte
<script>
  import { onMount } from 'svelte';
  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let showModal = false;
  let clientes = [];
  let clienteId = '';
  let producto = '';
  let cantidad = 1;
  let message = '';

  // Cargar clientes desde la API
  onMount(async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      if (!res.ok) throw new Error('Error cargando clientes');
      clientes = await res.json();
    } catch (err) {
      console.error(err);
      message = '⚠️ No se pudo cargar clientes';
    }
  });

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    message = '';
  }

  async function confirmarVenta() {
    try {
      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          producto,
          cantidad
        })
      });

      if (!res.ok) throw new Error('Error registrando venta');
      const data = await res.json();

      message = `✅ Venta registrada: ID ${data.id}`;
      closeModal();
    } catch (err) {
      console.error(err);
      message = '❌ Error al registrar venta';
    }
  }
</script>

<!-- Botón para abrir modal -->
<button
  class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl"
  on:click={openModal}>
  ➕ Registrar Nueva Venta
</button>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-blue-700">Registrar Venta</h3>
        <button on:click={closeModal} class="text-gray-500 text-3xl">&times;</button>
      </div>

      <!-- Formulario -->
      <form on:submit|preventDefault={confirmarVenta} class="space-y-4">
        <select bind:value={clienteId} class="w-full p-2 border rounded">
          <option value="">Público General</option>
          {#each clientes as c}
            <option value={c.id}>{c.nombre} {c.apellido}</option>
          {/each}
        </select>

        <input
          type="text"
          placeholder="Producto"
          bind:value={producto}
          required
          class="w-full p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Cantidad"
          bind:value={cantidad}
          min="1"
          class="w-full p-2 border rounded"
        />

        <button
          type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Guardar Venta
        </button>
      </form>
    </div>
  </div>
{/if}

<!-- Mensaje -->
{#if message}
  <p class="mt-4 text-center">{message}</p>
{/if}
```
