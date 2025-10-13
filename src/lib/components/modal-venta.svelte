<script>
  import { supabase } from '$lib/supabaseClient';
  import jsPDF from "jspdf";
  import "jspdf-autotable"; // ← Cambiado: importación como side-effect

  let { session } = $props();

  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let open = $state(false);
  let medicamentos = $state([]);
  let clientes = $state([]);
  let items = $state([]);
  let clienteId = $state('');
  let isLoading = $state(false);

  // Caché para mejorar rendimiento
  let medicamentosCache = $state(null);
  let clientesCache = $state(null);
  let cacheTimestamp = $state(0);
  const CACHE_DURATION = 5 * 60 * 1000;

  let totalGeneral = $derived(
    items.reduce((sum, item) => {
      const med = medicamentos.find(m => m.id === item.medicamentoId);
      const precio = med?.precio_venta || 0;
      return sum + (item.cantidad * precio);
    }, 0)
  );

  // --- Cargar datos ---
  async function loadData() {
    if (!session?.access_token) return;
    const now = Date.now();
    const cacheIsValid = (now - cacheTimestamp) < CACHE_DURATION;

    if (cacheIsValid && medicamentosCache && clientesCache) {
      medicamentos = medicamentosCache;
      clientes = clientesCache;
      if (!medicamentos?.length) {
        alert("No hay medicamentos disponibles.");
        close();
        return;
      }
      addItem();
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      const [medRes, clientRes] = await Promise.all([
        fetch(`${API_URL}/medicamentos`, { headers }),
        fetch(`${API_URL}/clientes`, { headers })
      ]);

      medicamentos = await medRes.json();
      clientes = await clientRes.json();

      medicamentosCache = medicamentos;
      clientesCache = clientes;
      cacheTimestamp = Date.now();

      if (!medicamentos?.length) {
        alert("No hay medicamentos disponibles.");
        close();
        return;
      }
      addItem();
    } catch (error) {
      alert(`Error al cargar datos: ${error.message}`);
      close();
    }
  }

  // --- Items ---
  function addItem() {
    items = [...items, {
      id: Date.now(),
      medicamentoId: medicamentos[0]?.id || 0,
      cantidad: 1
    }];
  }

  function removeItem(id) {
    items = items.filter(item => item.id !== id);
  }

  function updateItem(id, field, value) {
    items = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
  }

  function getPrecio(id) {
    return medicamentos.find(m => m.id === id)?.precio_venta || 0;
  }

  function getSubtotal(item) {
    return getPrecio(item.medicamentoId) * item.cantidad;
  }

  // --- PDF AUTOMÁTICO ---
  function generarPDF(venta) {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("BOTICA MI SALUD", 14, 15);
    doc.setFontSize(10);
    doc.text(`Venta ID: ${venta.venta_id}`, 14, 22);
    doc.text(`Cliente: ${venta.cliente_nombre || "Público General"}`, 14, 28);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 34);

    const rows = items.map(item => {
      const med = medicamentos.find(m => m.id === item.medicamentoId);
      return [
        med?.nombre || '',
        item.cantidad,
        med?.precio_venta?.toFixed(2) || '0.00',
        getSubtotal(item).toFixed(2)
      ];
    });

    // ← Cambiado: usar doc.autoTable en lugar de autoTable(doc, ...)
    doc.autoTable({
      startY: 40,
      head: [["Producto", "Cant.", "P.Unit.", "Subtotal"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY || 60;
    doc.text(`Total: S/ ${venta.total_calculado.toFixed(2)}`, 150, finalY + 10);

    doc.save(`venta_${venta.venta_id}.pdf`);
  }

  // --- Registrar venta ---
  async function submitVenta(e) {
    e.preventDefault();
    if (!items.length) {
      alert("Debe agregar al menos un producto.");
      return;
    }

    isLoading = true;

    const ventaData = {
      usuarioId: session.user.id,
      clienteId: clienteId ? parseInt(clienteId) : null,
      items: items.map(item => ({
        medicamento_id: parseInt(item.medicamentoId),
        cantidad: parseInt(item.cantidad)
      }))
    };

    try {
      const res = await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(ventaData)
      });

      const result = await res.json();
      if (!res.ok) {
        const err = JSON.parse(result.detail);
        throw new Error(err.message || "Error desconocido");
      }

      alert(`✅ Venta registrada correctamente. Generando PDF...`);
      generarPDF(result);

      // Cierra automáticamente tras generar PDF
      close();
      cacheTimestamp = 0;

    } catch (error) {
      alert(`❌ Error al registrar la venta: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  // --- Control modal ---
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

<!-- Botón abrir -->
<div class="text-center">
  <button 
    onclick={openModal}
    class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transition-all"
  >
    🛒 Registrar Nueva Venta
  </button>
</div>

<!-- Modal -->
{#if open}
  <div class="modal-overlay">
    <button
      type="button"
      class="modal-backdrop"
      onclick={close}
      aria-label="Cerrar modal"
    ></button>

    <div class="modal-content">
      <div class="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <h3 class="text-2xl font-bold text-white">Registrar Venta</h3>
        <button
          type="button"
          onclick={close}
          disabled={isLoading}
          class="text-white hover:bg-white/20 rounded-full p-2 text-3xl"
          aria-label="Cerrar modal"
        >
          &times;
        </button>
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
        <form onsubmit={submitVenta} class="space-y-6">
          <select 
            bind:value={clienteId}
            class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-gray-700"
          >
            <option value="">Público General</option>
            {#each clientes as cliente}
              <option value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>
            {/each}
          </select>

          <div class="grid grid-cols-12 gap-3 font-semibold text-gray-600 border-b pb-2">
            <div class="col-span-5">Producto</div>
            <div class="col-span-2 text-center">Cant.</div>
            <div class="col-span-2 text-center">P.Unit</div>
            <div class="col-span-2 text-center">Subt.</div>
            <div class="col-span-1"></div>
          </div>

          <div class="space-y-3">
            {#each items as item (item.id)}
              <div class="grid grid-cols-12 gap-3 items-center">
                <select 
                  value={item.medicamentoId}
                  onchange={(e) => updateItem(item.id, 'medicamentoId', parseInt(e.target.value))}
                  class="col-span-5 p-2 border-2 border-gray-300 rounded-lg"
                >
                  {#each medicamentos as med}
                    <option value={med.id}>{med.nombre} ({med.presentacion})</option>
                  {/each}
                </select>

                <input 
                  type="number"
                  value={item.cantidad}
                  oninput={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                  min="1"
                  class="col-span-2 p-2 border-2 border-gray-300 text-center rounded-lg"
                />

                <input type="text" value={getPrecio(item.medicamentoId).toFixed(2)} disabled class="col-span-2 p-2 border rounded-lg bg-gray-50 text-center" />
                <input type="text" value={getSubtotal(item).toFixed(2)} disabled class="col-span-2 p-2 border rounded-lg bg-gray-100 text-center font-semibold" />

                <button 
                  type="button"
                  onclick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  class="col-span-1 text-red-500 hover:text-red-700 font-bold text-xl flex justify-center"
                  aria-label="Eliminar producto"
                >
                  ×
                </button>
              </div>
            {/each}
          </div>

          <button type="button" onclick={addItem} class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">➕ Añadir Producto</button>

          <div class="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 text-right">
            <span class="text-lg font-semibold text-gray-700">Total:</span>
            <span class="text-2xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
          </div>

          <button 
            type="submit"
            disabled={isLoading || items.length === 0}
            class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg"
          >
            {isLoading ? '⏳ Procesando...' : 'Confirmar Venta'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}


<style>
  .modal-overlay {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 1rem;
  }
  .modal-backdrop {
    position: absolute; inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
  }
  .modal-content {
    position: relative; background: white;
    border-radius: 1rem; width: 100%; max-width: 48rem;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    overflow: hidden;
  }
</style>