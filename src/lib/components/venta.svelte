<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import jsPDF from 'jspdf';
  import ModalLotes from '$lib/components/ModalLotes.svelte';

  let session = null;
  let clientes = [];
  let medicamentos = [];
  let items = [];
  let clienteId = '';
  let isLoading = false;
  let totalGeneral = 0;

  // Modal
  let showModalLotes = false;
  let currentItemId = null;

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  // 🔹 Carga inicial
  onMount(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      goto('/login');
      return;
    }
    session = data.session;
    await loadData();
    addItem(); // primer ítem
  });

  // 🔹 Cargar datos
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
      alert(`Error cargando datos: ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

  // 🔹 Agregar ítem
  function addItem() {
    const defaultMed = medicamentos[0]?.id ?? 0;
    items = [
      ...items,
      {
        id: Date.now(),
        medicamentoId: defaultMed,
        cantidad: 1,
        loteId: null,
        loteInfo: null
      }
    ];
    calcTotal();
  }

  // 🔹 Eliminar ítem
  function removeItem(id) {
    if (items.length > 1) {
      items = items.filter((i) => i.id !== id);
      calcTotal();
    }
  }

  // 🔹 Actualizar campo
  function updateItem(id, field, value) {
    items = items.map((i) =>
      i.id === id ? { ...i, [field]: value > 0 ? value : 1 } : i
    );
    calcTotal();
  }

  // 🔹 Calcular total
  function calcTotal() {
    totalGeneral = items.reduce((sum, i) => {
      const med = medicamentos.find((m) => m.id == i.medicamentoId);
      const precio = med?.precio_venta || 0;
      return sum + i.cantidad * precio;
    }, 0);
  }

  // 🔹 Abrir modal para seleccionar lote
  function abrirModalLotes(itemId) {
    currentItemId = itemId;
    showModalLotes = true;
  }

  // 🔹 Manejar lote seleccionado
  function handleLoteSeleccionado(e) {
    const lote = e.detail;
    items = items.map((i) =>
      i.id === currentItemId
        ? { ...i, loteId: lote.id, loteInfo: lote }
        : i
    );
    showModalLotes = false;
  }

  // 🔹 Registrar venta
  async function submitVenta() {
    if (items.length === 0) return alert('Agrega al menos un producto.');

    const sinLote = items.find((i) => !i.loteId);
    if (sinLote) return alert('⚠️ Debes seleccionar un lote para todos los productos.');

    const ventaData = {
      usuarioId: session.user.id,
      clienteId: clienteId ? parseInt(clienteId) : null,
      items: items.map((i) => ({
        medicamento_id: parseInt(i.medicamentoId),
        cantidad: parseInt(i.cantidad),
        lote_id: parseInt(i.loteId)
      }))
    };

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
      if (!res.ok) throw new Error(result.error || 'Error al registrar venta');

      alert(`✅ Venta registrada! ID: ${result.venta_id}`);
      generatePDF(result);

      clienteId = '';
      items = [];
      addItem();
      totalGeneral = 0;
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

  // 🔹 Generar PDF (boleta)
  function generatePDF(ventaResult) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [72, 152]
    });

    doc.setFontSize(14);
    doc.text('Comprobante de Venta', 36, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`ID: ${ventaResult.venta_id}`, 36, 30, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 36, 38, { align: 'center' });

    const cliente = clientes.find((c) => c.id == clienteId);
    doc.text(
      `Cliente: ${cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Público General'}`,
      36,
      46,
      { align: 'center' }
    );

    doc.setFontSize(8);
    doc.text('Producto', 10, 60);
    doc.text('Cant.', 35, 60);
    doc.text('P.U.', 48, 60);
    doc.text('Total', 60, 60);
    doc.line(5, 62, 67, 62);

    let y = 70;
    items.forEach((item) => {
      const med = medicamentos.find((m) => m.id == item.medicamentoId);
      if (med) {
        const subtotal = item.cantidad * med.precio_venta;
        const name =
          med.nombre_comercial.length > 12
            ? med.nombre_comercial.substring(0, 9) + '...'
            : med.nombre_comercial;

        doc.text(name, 10, y);
        doc.text(item.cantidad.toString(), 35, y, { align: 'center' });
        doc.text(`S/ ${med.precio_venta.toFixed(2)}`, 48, y, { align: 'center' });
        doc.text(`S/ ${subtotal.toFixed(2)}`, 60, y, { align: 'center' });
        y += 7;
      }
    });

    doc.line(5, y + 2, 67, y + 2);
    doc.setFontSize(10);
    doc.text(`Total: S/ ${ventaResult.total_calculado.toFixed(2)}`, 36, y + 10, { align: 'center' });

    doc.save(`venta_${ventaResult.venta_id}.pdf`);
  }
</script>

<main class="container mx-auto p-6">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
      <h1 class="text-2xl font-bold text-white">Registrar Venta</h1>
    </div>

    <div class="p-6 space-y-6">
      <!-- Cliente -->
      <select bind:value={clienteId} class="w-full p-3 border rounded-lg">
        <option value="">Público General</option>
        {#each clientes as c}
          <option value={c.id}>{c.nombre} {c.apellido}</option>
        {/each}
      </select>

      <!-- Items -->
      <div>
        <div class="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 border-b pb-2">
          <div class="col-span-4">Producto</div>
          <div class="col-span-3 text-center">Lote</div>
          <div class="col-span-1 text-center">Cant.</div>
          <div class="col-span-2 text-center">Precio</div>
          <div class="col-span-2 text-center">Subtotal</div>
        </div>

        {#each items as item (item.id)}
          <div class="grid grid-cols-12 gap-3 items-center mt-2">
            <!-- Producto -->
            <select
              class="col-span-4 p-2 border rounded"
              bind:value={item.medicamentoId}
              on:change={(e) => updateItem(item.id, 'medicamentoId', parseInt(e.target.value))}
            >
              {#each medicamentos as m}
                <option value={m.id}>{m.nombre_comercial} ({m.forma_farmaceutica})</option>
              {/each}
            </select>

            <!-- Lote -->
            <div class="col-span-3 text-center">
              {#if item.loteInfo}
                <div class="text-sm">
                  #{item.loteInfo.id} — Stock: {item.loteInfo.cantidad_actual}
                </div>
              {:else}
                <span class="text-gray-400 italic">Sin lote</span>
              {/if}
              <button
                type="button"
                class="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                on:click={() => abrirModalLotes(item.id)}
              >
                📦 Seleccionar
              </button>
            </div>

            <!-- Cantidad -->
            <input
              type="number"
              min="1"
              class="col-span-1 p-2 border rounded text-center"
              bind:value={item.cantidad}
              on:input={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value))}
            />

            <!-- Precio -->
            <input
              type="text"
              class="col-span-2 p-2 border rounded text-center bg-gray-50"
              value={`S/ ${(medicamentos.find(m => m.id == item.medicamentoId)?.precio_venta || 0).toFixed(2)}`}
              disabled
            />

            <!-- Subtotal -->
            <input
              type="text"
              class="col-span-2 p-2 border rounded text-center font-semibold bg-gray-100"
              value={`S/ ${(item.cantidad * (medicamentos.find(m => m.id == item.medicamentoId)?.precio_venta || 0)).toFixed(2)}`}
              disabled
            />
          </div>
        {/each}
      </div>

      <!-- Total -->
      <div class="bg-gray-50 p-4 rounded-lg border text-right">
        <span class="text-lg font-semibold">Total: </span>
        <span class="text-2xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
      </div>

      <button
        class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg"
        on:click={submitVenta}
        disabled={isLoading}
      >
        {isLoading ? '⏳ Procesando...' : 'Confirmar Venta'}
      </button>
    </div>
  </div>

  <!-- Modal de Lotes -->
  {#if showModalLotes}
    <ModalLotes
      on:close={() => (showModalLotes = false)}
      on:select={handleLoteSeleccionado}
    />
  {/if}
</main>
