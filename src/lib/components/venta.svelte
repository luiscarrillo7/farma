<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import jsPDF from 'jspdf';

  let session = $state(null);
  let clientes = $state([]);
  let medicamentos = $state([]);
  let lotes = $state([]);
  let items = $state([]);
  let clienteId = $state('');
  let isLoading = $state(false);
  let showLotesModal = $state(false);
  let currentItemId = $state(null);
  let cargandoLotes = $state(false);
  let errorLotes = $state(null);
  let busqueda = $state('');
  
  const API_URL = 'https://farmacia-269414280318.europe-west1.run.app';

  let totalGeneral = $derived(
    items.reduce((sum, i) => sum + (i.cantidad * i.precioUnitario), 0)
  );

  let lotesFiltrados = $derived(
    lotes.filter(lote => {
      if (!busqueda) return lote.cantidad_actual > 0;
      const termino = busqueda.toLowerCase();
      return lote.cantidad_actual > 0 && (
        lote.medicamentos?.nombre_comercial?.toLowerCase().includes(termino) ||
        lote.numero_lote?.toLowerCase().includes(termino) ||
        lote.medicamentos?.categoria?.toLowerCase().includes(termino) ||
        lote.proveedores?.nombre?.toLowerCase().includes(termino)
      );
    })
  );

  $effect(() => {
    loadSession();
  });

  async function loadSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      goto('/login');
      return;
    }
    session = data.session;
    await loadData();
    addItem();
  }

  async function loadData() {
    if (!session?.access_token) return;
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

  async function loadLotes() {
    if (!session?.access_token) return;
    try {
      cargandoLotes = true;
      errorLotes = null;
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const res = await fetch(`${API_URL}/lotes`, { headers });
      if (!res.ok) throw new Error("Error al cargar los lotes");
      lotes = await res.json();
    } catch (e) {
      errorLotes = e.message;
    } finally {
      cargandoLotes = false;
    }
  }

  function addItem() {
    items = [...items, { 
      id: Date.now(), 
      medicamentoId: null, 
      loteId: null,
      nombreProducto: '',
      numeroLote: '',
      cantidad: 1,
      precioUnitario: 0
    }];
  }

  function removeItem(id) {
    if (items.length > 1) {
      items = items.filter((i) => i.id !== id);
    }
  }

  function updateItem(id, field, value) {
    items = items.map((i) => (i.id === id ? { ...i, [field]: value } : i));
  }

  async function openLotesModal(itemId) {
    currentItemId = itemId;
    showLotesModal = true;
    busqueda = '';
    await loadLotes();
  }

  function selectLote(lote) {
    if (currentItemId) {
      updateItem(currentItemId, 'medicamentoId', lote.medicamento_id);
      updateItem(currentItemId, 'loteId', lote.id);
      updateItem(currentItemId, 'nombreProducto', lote.medicamentos?.nombre_comercial || 'Producto');
      updateItem(currentItemId, 'numeroLote', lote.numero_lote);
      updateItem(currentItemId, 'precioUnitario', lote.medicamentos?.precio_venta || 0);
    }
    closeLotesModal();
  }

  function closeLotesModal() {
    showLotesModal = false;
    currentItemId = null;
    busqueda = '';
  }

  async function submitVenta(e) {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Agrega al menos un producto.');
      return;
    }

    const itemsSinProducto = items.filter(i => !i.medicamentoId);
    if (itemsSinProducto.length > 0) {
      alert('Por favor, selecciona un producto para todos los items.');
      return;
    }

    const ventaData = {
      usuarioId: session.user.id,
      clienteId: clienteId ? parseInt(clienteId) : null,
      items: items.map(i => ({
        medicamento_id: parseInt(i.medicamentoId),
        lote_id: i.loteId ? parseInt(i.loteId) : null,
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

      alert(`✅ Venta registrada! ID: ${result.venta_id} Total: S/ ${result.total_calculado}`);
      
      try {
        generatePDF(result);
      } catch (pdfError) {
        console.error('Error al generar PDF:', pdfError);
      }
      
      items = [];
      addItem();
      clienteId = '';
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

function generatePDF(ventaResult) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [72, 152] // Mantenemos tu tamaño exacto
    });
    
    doc.setFontSize(14);
    doc.text('BOTICA MI SALUD', 36, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Venta ID: ${ventaResult.venta_id}`, 36, 25, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 36, 32, { align: 'center' });
    
    const cliente = clientes.find(c => c.id == clienteId);
    if (cliente) {
      doc.text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 36, 39, { align: 'center' });
    } else {
      doc.text('Cliente: Público General', 36, 39, { align: 'center' });
    }
    
    doc.setFontSize(8);
    // Ajustado para mejor espaciado
    doc.text('Producto', 6, 50, { align: 'left' }); // Reducido 2mm
    doc.text('Cant.', 38, 50, { align: 'center' }); // Movido 2mm a la izquierda
    doc.text('P.U.', 46, 50, { align: 'center' }); // Movido 4mm a la izquierda
    doc.text('Total', 68, 50, { align: 'right' }); // Movido 3mm más a la derecha
    
    doc.line(5, 52, 67, 52); // Línea divisoria
    
    let yPos = 60;
    items.forEach(item => {
      if (item.medicamentoId) {
        const subtotal = item.cantidad * item.precioUnitario;
        
        // Ajustado truncado para mejor visualización
        let productName = item.nombreProducto;
        if (productName.length > 20) {
          productName = productName.substring(0, 17) + '...';
        }
        
        doc.text(productName, 6, yPos, { align: 'left' }); // Reducido 2mm
        doc.text(item.cantidad.toString(), 38, yPos, { align: 'center' }); // Movido 2mm a la izquierda
        doc.text(`S/ ${item.precioUnitario.toFixed(2)}`, 46, yPos, { align: 'center' }); // Movido 4mm a la izquierda
        doc.text(`S/ ${subtotal.toFixed(2)}`, 68, yPos, { align: 'right' }); // Movido 3mm más a la derecha
        
        yPos += 9; // Espaciado entre filas
        
        if (yPos > 135) {
          doc.addPage();
          yPos = 20;
        }
      }
    });
    
    yPos += 3;
    doc.line(5, yPos, 67, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`TOTAL: S/ ${ventaResult.total_calculado.toFixed(2)}`, 36, yPos, { align: 'center' });
    
    doc.save(`venta_${ventaResult.venta_id}.pdf`);
}
</script>

<main class="container mx-auto p-6">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
      <h1 class="text-2xl font-bold text-white">Registrar Venta</h1>
    </div>

    <div class="p-6">
      <form onsubmit={submitVenta} class="space-y-6">
        <!-- Selector de Cliente -->
        <select 
          bind:value={clienteId}
          class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-gray-700"
        >
          <option value="">Público General</option>
          {#each clientes as c}
            <option value={c.id}>{c.nombre} {c.apellido}</option>
          {/each}
        </select>

        <!-- Encabezados -->
        <div class="grid grid-cols-12 gap-3 font-semibold text-gray-600 border-b pb-2">
          <div class="col-span-5">Producto</div>
          <div class="col-span-2 text-center">Cant.</div>
          <div class="col-span-2 text-center">P.Unit</div>
          <div class="col-span-2 text-center">Subt.</div>
          <div class="col-span-1"></div>
        </div>

        <!-- Items -->
        <div class="space-y-3">
          {#each items as item (item.id)}
            <div class="grid grid-cols-12 gap-3 items-center">
              <!-- Botón Seleccionar Producto -->
              <div class="col-span-5">
                {#if item.nombreProducto}
                  <div class="p-2 border-2 border-gray-300 rounded-lg bg-gray-50">
                    <div class="text-sm font-medium">{item.nombreProducto}</div>
                    {#if item.numeroLote}
                      <div class="text-xs text-gray-500">Lote: {item.numeroLote}</div>
                    {/if}
                  </div>
                {:else}
                  <button
                    type="button"
                    onclick={() => openLotesModal(item.id)}
                    class="w-full p-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition"
                  >
                    Seleccionar
                  </button>
                {/if}
              </div>

              <input 
                type="number"
                bind:value={item.cantidad}
                oninput={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                min="1"
                class="col-span-2 p-2 border-2 border-gray-300 text-center rounded-lg"
              />

              <input 
                type="text" 
                value={`S/ ${item.precioUnitario.toFixed(2)}`} 
                disabled 
                class="col-span-2 p-2 border rounded-lg bg-gray-50 text-center" 
              />
              
              <input 
                type="text" 
                value={`S/ ${(item.cantidad * item.precioUnitario).toFixed(2)}`} 
                disabled 
                class="col-span-2 p-2 border rounded-lg bg-gray-100 text-center font-semibold" 
              />

              <button 
                type="button"
                onclick={() => removeItem(item.id)}
                disabled={items.length === 1}
                class="col-span-1 text-red-500 hover:text-red-700 font-bold text-xl flex justify-center disabled:opacity-50"
              >
                ×
              </button>
            </div>
          {/each}
        </div>

        <!-- Botón añadir producto -->
        <button 
          type="button" 
          onclick={addItem} 
          class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
        >
          ➕ Añadir Producto
        </button>

        <!-- Total -->
        <div class="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 text-right">
          <span class="text-lg font-semibold text-gray-700">Total:</span>
          <span class="text-2xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
        </div>

        <!-- Confirmar -->
        <button 
          type="submit"
          disabled={isLoading || items.length === 0}
          class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? '⏳ Procesando...' : 'Confirmar Venta'}
        </button>
      </form>
    </div>
  </div>
</main>

<!-- Modal de Selección de Lotes -->
{#if showLotesModal}
  <div class="modal-overlay">
    <button
      type="button"
      class="modal-backdrop"
      onclick={closeLotesModal}
      aria-label="Cerrar modal"
    ></button>

    <div class="modal-content">
      <!-- Header del Modal -->
      <div class="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <h3 class="text-2xl font-bold text-white">📦 Seleccionar Lote</h3>
        <button
          type="button"
          onclick={closeLotesModal}
          disabled={cargandoLotes}
          class="text-white hover:bg-white/20 rounded-full p-2 text-3xl"
          aria-label="Cerrar modal"
        >
          &times;
        </button>
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-80px)]">
        <!-- Barra de búsqueda -->
        <div class="p-4 border-b bg-gray-50 sticky top-0 z-10">
          <input
            type="text"
            bind:value={busqueda}
            placeholder="🔍 Buscar por medicamento, lote, categoría o proveedor..."
            class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>

        <!-- Contenido del Modal -->
        <div class="p-4">
          {#if cargandoLotes}
            <div class="text-center py-8">
              <p class="text-gray-600">Cargando lotes...</p>
            </div>
          {:else if errorLotes}
            <div class="text-center py-8">
              <p class="text-red-500">❌ {errorLotes}</p>
            </div>
          {:else if lotesFiltrados.length === 0}
            <div class="text-center py-8">
              <p class="text-gray-600">
                {busqueda ? 'No se encontraron lotes que coincidan con la búsqueda.' : 'No hay lotes disponibles.'}
              </p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300 text-sm">
                <thead class="bg-gray-100 sticky top-0">
                  <tr>
                    <th class="border border-gray-300 p-2 text-left">Medicamento</th>
                    <th class="border border-gray-300 p-2 text-left">Categoría</th>
                    <th class="border border-gray-300 p-2 text-left">N° Lote</th>
                    <th class="border border-gray-300 p-2 text-left">Proveedor</th>
                    <th class="border border-gray-300 p-2 text-center">Ingreso</th>
                    <th class="border border-gray-300 p-2 text-center">Vencimiento</th>
                    <th class="border border-gray-300 p-2 text-center">Stock</th>
                    <th class="border border-gray-300 p-2 text-right">Precio Venta</th>
                    <th class="border border-gray-300 p-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {#each lotesFiltrados as lote}
                    <tr class="hover:bg-blue-50 transition">
                      <td class="border border-gray-300 p-2 font-medium">
                        {lote.medicamentos?.nombre_comercial || 'N/A'}
                      </td>
                      <td class="border border-gray-300 p-2">
                        {lote.medicamentos?.categoria || 'N/A'}
                      </td>
                      <td class="border border-gray-300 p-2 font-mono text-xs">
                        {lote.numero_lote || 'N/A'}
                      </td>
                      <td class="border border-gray-300 p-2">
                        {lote.proveedores?.nombre || 'N/A'}
                      </td>
                      <td class="border border-gray-300 p-2 text-center text-xs">
                        {new Date(lote.fecha_ingreso).toLocaleDateString('es-PE')}
                      </td>
                      <td class="border border-gray-300 p-2 text-center text-xs">
                        {new Date(lote.fecha_vencimiento).toLocaleDateString('es-PE')}
                      </td>
                      <td class="border border-gray-300 p-2 text-center">
                        <span class="inline-block px-2 py-1 rounded {lote.cantidad_actual < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                          {lote.cantidad_actual}
                        </span>
                      </td>
                      <td class="border border-gray-300 p-2 text-right font-semibold">
                        S/ {lote.medicamentos?.precio_venta?.toFixed(2) || '0.00'}
                      </td>
                      <td class="border border-gray-300 p-2 text-center">
                        <button
                          type="button"
                          onclick={() => selectLote(lote)}
                          class="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition font-medium"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed; 
    inset: 0;
    display: flex; 
    align-items: center; 
    justify-content: center;
    z-index: 50; 
    padding: 1rem;
  }
  
  .modal-backdrop {
    position: absolute; 
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
    cursor: pointer;
    border: none;
  }
  
  .modal-content {
    position: relative; 
    background: white;
    border-radius: 1rem; 
    width: 100%; 
    max-width: 80rem;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    overflow: hidden;
    max-height: 90vh;
  }
</style>