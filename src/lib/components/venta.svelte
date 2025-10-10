<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import jsPDF from 'jspdf';

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
      alert(`Error cargando datos: ${e.message}`);
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

  async function submitVenta() {
    if (items.length === 0) {
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

      // Mostrar mensaje de éxito
      alert(`✅ Venta registrada! ID: ${result.venta_id} Total: $${result.total_calculado}`);
      
      // Generar PDF de la venta
      await generatePDF(result);
      
      // Limpiar formulario
      items = [];
      addItem();
      clienteId = '';
      totalGeneral = 0;
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function generatePDF(ventaResult) {
    try {
      // Verificar si jsPDF está disponible
      if (typeof jsPDF === 'undefined') {
        throw new Error('La librería de PDF no está disponible');
      }
      
      const doc = new jsPDF();
      
      // Configuración inicial
      doc.setFontSize(20);
      doc.text('Comprobante de Venta', 105, 15, { align: 'center' });
      
      // Información de la venta
      doc.setFontSize(12);
      doc.text(`ID de Venta: ${ventaResult.venta_id}`, 20, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 40);
      
      // Información del cliente
      if (clienteId) {
        const cliente = clientes.find(c => c.id == clienteId);
        if (cliente) {
          doc.text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 20, 50);
        }
      } else {
        doc.text('Cliente: Público General', 20, 50);
      }
      
      // Encabezado de tabla
      doc.setFontSize(10);
      doc.text('Producto', 20, 70);
      doc.text('Cant.', 100, 70);
      doc.text('P.U.', 130, 70);
      doc.text('Subtotal', 160, 70);
      
      // Línea divisoria
      doc.line(20, 75, 190, 75);
      
      // Items de la venta
      let yPos = 85;
      // Usamos los items del componente en lugar de los de la respuesta
      items.forEach(item => {
        const medicamento = medicamentos.find(m => m.id == item.medicamentoId);
        if (medicamento) {
          const subtotal = item.cantidad * medicamento.precio_venta;
          
          doc.text(medicamento.nombre_comercial, 20, yPos);
          doc.text(item.cantidad.toString(), 100, yPos);
          doc.text(`S/ ${medicamento.precio_venta.toFixed(2)}`, 130, yPos);
          doc.text(`S/ ${subtotal.toFixed(2)}`, 160, yPos);
          
          yPos += 10;
        }
      });
      
      // Total
      yPos += 10;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Total: S/ ${ventaResult.total_calculado.toFixed(2)}`, 160, yPos, { align: 'right' });
      
      // Guardar el PDF
      doc.save(`venta_${ventaResult.venta_id}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert(`Error al generar el PDF: ${error.message}`);
    }
  }
</script>

<main class="container mx-auto p-6">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
      <h1 class="text-2xl font-bold text-white">Registrar Venta</h1>
    </div>

    <div class="p-6 space-y-6">
      <!-- Selector de Cliente -->
      <select bind:value={clienteId} class="w-full p-3 border rounded-lg">
        <option value="">Público General</option>
        {#each clientes as c}
          <option value={c.id}>{c.nombre} {c.apellido}</option>
        {/each}
      </select>

      <!-- Items -->
      <div>
        <div class="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 border-b pb-2">
          <div class="col-span-5">Producto</div>
          <div class="col-span-2 text-center">Cantidad</div>
          <div class="col-span-2 text-center">Precio Unit.</div>
          <div class="col-span-2 text-center">Subtotal</div>
          <div class="col-span-1"></div>
        </div>

        {#each items as item (item.id)}
          <div class="grid grid-cols-12 gap-3 items-center mt-2">
            <select
              class="col-span-5 p-2 border rounded"
              bind:value={item.medicamentoId}
              on:change={(e) => updateItem(item.id, 'medicamentoId', parseInt(e.target.value))}
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
              class="col-span-2 p-2 border rounded text-center"
              bind:value={item.cantidad}
              on:input={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value))}
            />

            <input
              type="text"
              class="col-span-2 p-2 border rounded text-center bg-gray-50"
              value={`S/ ${(medicamentos.find(m => m.id == item.medicamentoId)?.precio_venta || 0).toFixed(2)}`}
              disabled
            />

            <input
              type="text"
              class="col-span-2 p-2 border rounded text-center font-semibold bg-gray-100"
              value={`S/ ${(item.cantidad * (medicamentos.find(m => m.id == item.medicamentoId)?.precio_venta || 0)).toFixed(2)}`}
              disabled
            />

            <button
              type="button"
              class="col-span-1 text-red-500 font-bold"
              on:click={() => removeItem(item.id)}
              disabled={items.length === 1}
            >
              X
            </button>
          </div>
        {/each}
      </div>

      <!-- Botón añadir producto -->
      <button type="button" class="w-full bg-gray-100 p-2 rounded" on:click={addItem}>
        ➕ Añadir Producto
      </button>

      <!-- Total -->
      <div class="bg-gray-50 p-4 rounded-lg border">
        <div class="text-right">
          <span class="text-lg font-semibold">Total General: </span>
          <span class="text-2xl font-bold text-green-600">S/ {totalGeneral.toFixed(2)}</span>
        </div>
      </div>

      <!-- Confirmar -->
      <button
        class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg"
        on:click={submitVenta}
        disabled={isLoading}
      >
        {isLoading ? '⏳ Procesando...' : 'Confirmar Venta'}
      </button>
    </div>
  </div>
</main>