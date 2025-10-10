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
      generarBoletaPDF(result);

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

  function generarBoletaPDF(venta) {
    const fecha = new Date().toLocaleString();
    const lineas = items.map((i) => {
      const med = medicamentos.find((m) => m.id == i.medicamentoId);
      const subtotal = i.cantidad * (med?.precio_venta || 0);
      return [
        { text: i.cantidad.toString(), width: 30 },
        { text: med?.nombre_comercial || '', width: 90 },
        { text: med?.precio_venta.toFixed(2) || '', width: 40, alignment: 'right' },
        { text: subtotal.toFixed(2), width: 45, alignment: 'right' }
      ];
    });

    const total = totalGeneral;
    const igv = total * 0.18;
    const totalConIgv = total + igv;

    const docDefinition = {
      pageSize: { width: 204, height: 'auto' }, // 72 mm
      pageMargins: [10, 10, 10, 10],
      content: [
        { text: 'SISFARMA', style: 'header', alignment: 'center', color: '#0a6f3c' },
        { text: 'Sisfarma Central Lima S.A.C.', style: 'subheader', alignment: 'center' },
        { text: 'R.U.C.: 11111111111', alignment: 'center' },
        { text: 'Telf: 111-1111', alignment: 'center', margin: [0, 0, 0, 10] },
        { text: `FECHA DE EMISIÓN: ${fecha}`, fontSize: 8, alignment: 'center', margin: [0, 0, 0, 10] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 184, y2: 0, lineWidth: 1 }] },
        { text: `TICKET N° 001-000000001`, margin: [0, 4, 0, 4], alignment: 'center' },
        { text: `CLIENTE: ${clienteId ? clientes.find(c => c.id == clienteId)?.nombre : 'Público en general'}`, fontSize: 9 },
        { text: `USUARIO: ${session.user.email}`, fontSize: 9, margin: [0, 0, 0, 6] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 184, y2: 0, lineWidth: 1 }] },

        {
          table: {
            widths: [30, 90, 40, 45],
            body: [
              [
                { text: 'CANT.', bold: true },
                { text: 'DESCRIPCIÓN', bold: true },
                { text: 'P.UNIT.', bold: true, alignment: 'right' },
                { text: 'IMPORTE', bold: true, alignment: 'right' }
              ],
              ...lineas
            ]
          },
          layout: 'noBorders',
          fontSize: 8,
          margin: [0, 6, 0, 6]
        },

        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 184, y2: 0, lineWidth: 1 }] },
        {
          alignment: 'right',
          fontSize: 9,
          margin: [0, 4, 0, 0],
          stack: [
            `TOTAL A PAGAR: S/ ${total.toFixed(2)}`,
            `IGV (18%): S/ ${igv.toFixed(2)}`,
            `IMPORTE TOTAL: S/ ${totalConIgv.toFixed(2)}`
          ]
        },
        { text: '\nGracias por su compra', alignment: 'center', italics: true, fontSize: 9 }
      ],
      styles: {
        header: { fontSize: 14, bold: true },
        subheader: { fontSize: 10 }
      }
    };

    pdfMake.createPdf(docDefinition).open();
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
