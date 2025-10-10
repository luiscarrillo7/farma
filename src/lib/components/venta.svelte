<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import jsPDF from 'jspdf';
	import { Script } from 'vm';

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

      alert(`✅ Venta registrada! ID: ${result.venta_id} Total: $${result.total_calculado}`);
      
      // Generar PDF de la venta
      try {
        generatePDF(result);
      } catch (pdfError) {
        console.error('Error al generar PDF:', pdfError);
        // No mostrar alerta aquí para evitar dos alertas
      }
      
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


  function generatePDF(ventaResult) {
    // Crear PDF con tamaño personalizado: 72mm de ancho y 152mm de altura (150mm + 2mm margen inferior)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [72, 152] // Ancho: 72mm, Altura: 150mm + 2mm margen inferior
    });
    
    // Configuración inicial
    doc.setFontSize(14);
    doc.text('Comprobante de Venta', 36, 15, { align: 'center' }); // Centrado en 72mm
    
    // Información de la venta (centrada)
    doc.setFontSize(10);
    doc.text(`ID: ${ventaResult.venta_id}`, 36, 30, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 36, 40, { align: 'center' });
    
    // Información del cliente (centrada)
    const cliente = clientes.find(c => c.id == clienteId);
    if (cliente) {
      doc.text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 36, 50, { align: 'center' });
    } else {
      doc.text('Cliente: Público General', 36, 50, { align: 'center' });
    }
    
    // Encabezado de tabla (centrado)
    doc.setFontSize(8);
    doc.text('Producto', 18, 70, { align: 'center' });
    doc.text('Cant.', 34, 70, { align: 'center' });
    doc.text('P.U.', 46, 70, { align: 'center' });
    doc.text('Total', 58, 70, { align: 'center' });
    
    // Línea divisoria
    doc.line(2, 73, 70, 73);
    
    // Items de la venta (centrados)
    let yPos = 83;
    items.forEach(item => {
      const medicamento = medicamentos.find(m => m.id == item.medicamentoId);
      if (medicamento) {
        const subtotal = item.cantidad * medicamento.precio_venta;
        
        // Truncar nombre de producto
        let productName = medicamento.nombre_comercial;
        if (productName.length > 12) {
          productName = productName.substring(0, 9) + '...';
        }
        
        doc.text(productName, 18, yPos, { align: 'center' });
        doc.text(item.cantidad.toString(), 34, yPos, { align: 'center' });
        doc.text(`S/ ${medicamento.precio_venta.toFixed(2)}`, 46, yPos, { align: 'center' });
        doc.text(`S/ ${subtotal.toFixed(2)}`, 58, yPos, { align: 'center' });
        
        yPos += 8;
        
        // Añadir página si necesitamos más espacio (ajustado para nueva altura)
        if (yPos > 132) { // 150 - 18 (margen superior) - 2 (margen inferior) = 130, pero dejamos un poco más de espacio
          doc.addPage();
          yPos = 15;
        }
      }
    });
    
    // Total final (centrado) con margen inferior
    yPos += 5;
    doc.line(2, yPos, 70, yPos);
    yPos += 8; // Aumentado el espacio antes del total para mejor separación
    doc.setFontSize(10);
    doc.text(`Total: S/ ${ventaResult.total_calculado.toFixed(2)}`, 36, yPos, { align: 'center' });
    
    // Guardar el PDF
    doc.save(`venta_${ventaResult.venta_id}.pdf`);
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