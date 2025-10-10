<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import pdfMake from "pdfmake/build/pdfmake";
  import pdfFonts from "pdfmake/build/vfs_fonts";
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
  let session = null;
  let clientes = [];
  let medicamentos = [];
  let items = [];
  let clienteId = '';
  let isLoading = false;
  let totalGeneral = 0;

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  onMount(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      goto('/login');
      return;
    }
    session = data.session;
    await loadData();
    addItem(); // primer ítem por defecto
  });

  async function loadData() {
    try {
      isLoading = true;
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [medRes, cliRes] = await Promise.all([
        fetch(`${API_URL}/medicamentos`, { headers }),
        fetch(`${API_URL}/clientes`, { headers })
      ]);
      medicamentos = await medRes.json();
      clientes = await cliRes.json();
    } catch (e) {
      console.error(`Error cargando datos: ${e.message}`);
      // En un caso real, mostrarías un mensaje más amigable al usuario.
    } finally {
      isLoading = false;
    }
  }

  function addItem() {
    items = [...items, { id: Date.now(), medicamentoId: medicamentos[0]?.id ?? 0, cantidad: 1 }];
    calcTotal();
  }

  function removeItem(id) {
    if (items.length > 1) {
      items = items.filter((i) => i.id !== id);
      calcTotal();
    }
  }

  function updateItem(id, field, value) {
    items = items.map((i) => (i.id === id ? { ...i, [field]: value } : i));
    calcTotal();
  }

  function calcTotal() {
    totalGeneral = items.reduce((sum, i) => {
      const med = medicamentos.find((m) => m.id == i.medicamentoId);
      return sum + (i.cantidad * (med?.precio_venta || 0));
    }, 0);
  }
  
  /**
   * Genera y descarga una boleta en PDF con los datos de la venta.
   * @param {object} ventaResult - El resultado de la API tras registrar la venta.
   */
  function generarBoleta(ventaResult) {
    const clienteSeleccionado = clientes.find(c => c.id == clienteId);
    const nombreCliente = clienteSeleccionado 
      ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` 
      : 'Público General';

    const tableBody = items.map(item => {
      const med = medicamentos.find(m => m.id == item.medicamentoId);
      const precio = med?.precio_venta || 0;
      const subtotal = item.cantidad * precio;
      return [
        med?.nombre_comercial || 'N/A',
        item.cantidad,
        `S/ ${precio.toFixed(2)}`,
        `S/ ${subtotal.toFixed(2)}`
      ];
    });

    const docDefinition = {
      content: [
        { text: 'Farmacia "El Bienestar"', style: 'header' },
        { text: 'Boleta de Venta Electrónica', style: 'subheader' },
        { text: `Nro. Venta: ${ventaResult.venta_id}`, margin: [0, 0, 0, 5] },
        { text: `Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin: [0, 0, 0, 10] },
        { text: `Cliente: ${nombreCliente}`, bold: true, margin: [0, 0, 0, 10] },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [{ text: 'Producto', bold: true }, { text: 'Cantidad', bold: true, alignment: 'center' }, { text: 'P. Unit.', bold: true }, { text: 'Subtotal', bold: true }],
              ...tableBody
            ]
          }
        },
        {
          text: `Total: S/ ${totalGeneral.toFixed(2)}`,
          style: 'total',
          alignment: 'right',
          margin: [0, 20, 0, 0]
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
        subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 15] },
        total: { fontSize: 16, bold: true }
      },
      defaultStyle: {
        fontSize: 11
      }
    };

    pdfMake.createPdf(docDefinition).download(`boleta-${ventaResult.venta_id}.pdf`);
  }

async function submitVenta() {
  if (items.length === 0) {
    // Sería mejor usar un modal o una notificación no bloqueante en lugar de alert.
    alert('Agrega al menos un producto.');
    return;
  }

  const ventaData = {
    usuarioId: session.user.id,
    clienteId: clienteId ? parseInt(clienteId) : null,
    items: items.map(i => ({
      medicamento_id: parseInt(i.medicamentoId),
      cantidad: parseInt(i.cantidad)
    }))
  };

  console.log("📦 Enviando venta:", ventaData);

  try {
    isLoading = true;
    const res = await fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(ventaData)
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("❌ Error respuesta API:", result);
      throw new Error(result.error || 'Error al registrar venta');
    }

    // --- ¡AQUÍ SE GENERA EL PDF! ---
    generarBoleta(result); 
    // ---------------------------------
    
    alert(`✅ Venta registrada! ID: ${result.venta_id} Total: $${result.total_calculado}`);
    
    // Limpiar formulario para la siguiente venta
    items = [];
    addItem();
    clienteId = '';
    totalGeneral = 0;
  } catch (e) {
    console.error(e);
    alert(`❌ Error: ${e.message}`);
  } finally {
    isLoading = false;
  }
}

</script>

<main class="container mx-auto p-6 bg-gray-50 min-h-screen">
  <div class="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl mx-auto">
    <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
      <h1 class="text-3xl font-bold text-white tracking-wide">Registrar Venta</h1>
    </div>

    <div class="p-6 space-y-6">
      
      <div>
        <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <select id="cliente" bind:value={clienteId} class="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">Público General</option>
            {#each clientes as c}
              <option value={c.id}>{c.nombre} {c.apellido}</option>
            {/each}
          </select>
      </div>

      <!-- Items -->
      <div class="border rounded-lg p-4">
        <div class="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 uppercase border-b pb-2 mb-3">
          <div class="col-span-5">Producto</div>
          <div class="col-span-2 text-center">Cantidad</div>
          <div class="col-span-2 text-center">Precio Unit.</div>
          <div class="col-span-2 text-center">Subtotal</div>
          <div class="col-span-1"></div>
        </div>

        {#each items as item (item.id)}
          <div class="grid grid-cols-12 gap-3 items-center mt-2 animate-fade-in">
            <select
              class="col-span-5 p-2 border border-gray-300 rounded"
              bind:value={item.medicamentoId}
              on:change={() => calcTotal()}
            >
              {#each medicamentos as m}
                <option value={m.id}>
                  {m.nombre_comercial} ({m.forma_farmaceutica})
                </option>
              {/each}
            </select>

            <input
              type="number"
              min="1"
              class="col-span-2 p-2 border border-gray-300 rounded text-center"
              bind:value={item.cantidad}
              on:input={() => calcTotal()}
            />

            <div class="col-span-2 p-2 text-center text-gray-700">
              S/ {(medicamentos.find(m => m.id == item.medicamentoId)?.precio_venta || 0).toFixed(2)}
            </div>

            <div class="col-span-2 p-2 text-center font-semibold text-gray-800">
              S/ {(item.cantidad * (medicamentos.find(m => m.id == item.medicamentoId)?.precio_venta || 0)).toFixed(2)}
            </div>
            
            <button
              type="button"
              class="col-span-1 flex justify-center items-center text-red-500 hover:text-red-700 disabled:opacity-50"
              on:click={() => removeItem(item.id)}
              disabled={items.length === 1}
              title="Eliminar ítem"
              aria-label="Eliminar ítem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        {/each}
      </div>

      <!-- Botón añadir producto -->
      <button type="button" class="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 p-2 rounded-lg font-semibold transition" on:click={addItem}>
        ➕ Añadir Producto
      </button>

      <!-- Total -->
      <div class="bg-gray-100 p-4 rounded-lg border flex justify-end items-center">
        <span class="text-lg font-semibold text-gray-600 mr-4">Total General: </span>
        <span class="text-3xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
      </div>

      <!-- Confirmar -->
      <button
        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transition transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
        on:click={submitVenta}
        disabled={isLoading || items.length === 0 || totalGeneral === 0}
      >
        {#if isLoading}
          <div class="flex justify-center items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </div>
        {:else}
          Confirmar Venta
        {/if}
      </button>
    </div>
  </div>
</main>

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
</style>

