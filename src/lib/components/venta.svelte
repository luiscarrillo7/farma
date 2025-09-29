```svelte
<script>
  import { onMount } from 'svelte';

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let showModal = false;
  let clientes = [];
  let productos = [];
  let clienteId = '';
  let items = [];
  let mensaje = '';
  let loading = false;

  // Cargar clientes y productos al abrir modal
  onMount(async () => {
    try {
      const resClientes = await fetch(`${API_URL}/clientes`);
      clientes = await resClientes.json();

      const resProductos = await fetch(`${API_URL}/medicamentos`);
      productos = await resProductos.json();
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  });

  function abrirModal() {
    clienteId = '';
    items = [
      { productoId: '', cantidad: 1, precio: 0, subtotal: 0 }
    ];
    mensaje = '';
    showModal = true;
  }

  function cerrarModal() {
    showModal = false;
  }

  function agregarItem() {
    items = [...items, { productoId: '', cantidad: 1, precio: 0, subtotal: 0 }];
  }

  function quitarItem(index) {
    items = items.filter((_, i) => i !== index);
  }

  function actualizarProducto(index, productoId) {
    const producto = productos.find(p => p.id == productoId);
    if (producto) {
      items[index].productoId = productoId;
      items[index].precio = producto.precio;
      items[index].subtotal = producto.precio * items[index].cantidad;
    }
  }

  function actualizarCantidad(index, cantidad) {
    items[index].cantidad = +cantidad;
    items[index].subtotal = items[index].precio * items[index].cantidad;
  }

  $: totalGeneral = items.reduce((acc, i) => acc + i.subtotal, 0);

  async function registrarVenta() {
    if (!clienteId || items.length === 0) {
      mensaje = '❌ Seleccione un cliente y al menos un producto';
      return;
    }

    loading = true;
    mensaje = 'Procesando...';

    try {
      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, items })
      });

      if (res.ok) {
        mensaje = '✅ Venta registrada correctamente';
        cerrarModal();
      } else {
        const err = await res.json();
        mensaje = `❌ Error: ${err.message || 'No se pudo registrar'}`;
      }
    } catch (error) {
      console.error(error);
      mensaje = '❌ Error de conexión con la API';
    } finally {
      loading = false;
    }
  }
</script>

<button on:click={abrirModal} class="btn">➕ Nueva Venta</button>

{#if showModal}
  <div class="modal">
    <div class="modal-content">
      <h2>Registrar Venta</h2>

      <label for="cliente">Cliente:</label>
<select id="cliente" bind:value={clienteId} required>
  <option value="">-- Seleccione --</option>
  {#each clientes as cliente}
    <option value={cliente.id}>{cliente.nombre}</option>
  {/each}
</select>

      <h3>Productos</h3>
      {#each items as item, i}
        <div class="item-row">
          <select
            bind:value={item.productoId}
            on:change={(e) => actualizarProducto(i, e.target.value)}
          >
            <option value="">-- Producto --</option>
            {#each productos as p}
              <option value={p.id}>{p.nombre} - S/ {p.precio}</option>
            {/each}
          </select>

          <input
            type="number"
            min="1"
            bind:value={item.cantidad}
            on:input={(e) => actualizarCantidad(i, e.target.value)}
          />

          <span>Precio: S/ {item.precio}</span>
          <span>Subtotal: S/ {item.subtotal}</span>

          <button type="button" on:click={() => quitarItem(i)}>❌</button>
        </div>
      {/each}

      <button type="button" on:click={agregarItem}>➕ Agregar producto</button>

      <h3>Total: S/ {totalGeneral}</h3>

      <div class="acciones">
        <button on:click={registrarVenta} disabled={loading}>
          {#if loading}Procesando...{:else}Registrar Venta{/if}
        </button>
        <button type="button" on:click={cerrarModal}>Cancelar</button>
      </div>

      <p>{mensaje}</p>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }
  .item-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .acciones {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
  }
</style>
```
