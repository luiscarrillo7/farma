<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let medicamentos = [];
  let proveedores = [];

  // Datos del formulario
  let medicamentoId = "";
  let proovedorId = "";
  let fechaIngreso = "";
  let fechaVencimiento = "";
  let cantidaInicial = 0;
  let cantidaActual = 0;
  let precioCompra = 0;

  // Cargar combos desde tu API
  onMount(async () => {
    const resMed = await fetch("http://localhost:5000/medicamentos");
    medicamentos = await resMed.json();

    const resProv = await fetch("http://localhost:5000/proveedores");
    proveedores = await resProv.json();
  });

  async function agregarLote() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const response = await fetch("http://localhost:5000/lotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        medicamentoId,
        proovedorId,
        fechaIngreso,
        fechaVencimiento,
        cantidaInicial,
        cantidaActual,
        precioCompra
      })
    });

    if (response.ok) {
      alert("✅ Lote agregado con éxito");
      goto("/inventario"); // refrescar la vista
    } else {
      const error = await response.json();
      alert("❌ Error: " + error.detail);
    }
  }
</script>

<div class="p-8 max-w-2xl mx-auto">
  <h2 class="text-2xl font-bold mb-6">Agregar Lote</h2>

 <form on:submit|preventDefault={agregarLote} class="space-y-4 bg-white p-6 rounded-lg shadow">
  <div>
    <label for="medicamento" class="block mb-1 font-semibold">Medicamento</label>
    <select id="medicamento" bind:value={medicamentoId} class="w-full border rounded p-2">
      <option value="">-- Seleccione --</option>
      {#each medicamentos as m}
        <option value={m.id}>{m.nombre}</option>
      {/each}
    </select>
  </div>

  <div>
    <label for="proveedor" class="block mb-1 font-semibold">Proveedor</label>
    <select id="proveedor" bind:value={proovedorId} class="w-full border rounded p-2">
      <option value="">-- Seleccione --</option>
      {#each proveedores as p}
        <option value={p.id}>{p.nombre}</option>
      {/each}
    </select>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label for="fechaIngreso" class="block mb-1 font-semibold">Fecha Ingreso</label>
      <input id="fechaIngreso" type="date" bind:value={fechaIngreso} class="w-full border rounded p-2" />
    </div>
    <div>
      <label for="fechaVencimiento" class="block mb-1 font-semibold">Fecha Vencimiento</label>
      <input id="fechaVencimiento" type="date" bind:value={fechaVencimiento} class="w-full border rounded p-2" />
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label for="cantidaInicial" class="block mb-1 font-semibold">Cantidad Inicial</label>
      <input id="cantidaInicial" type="number" bind:value={cantidaInicial} class="w-full border rounded p-2" />
    </div>
    <div>
      <label for="cantidaActual" class="block mb-1 font-semibold">Cantidad Actual</label>
      <input id="cantidaActual" type="number" bind:value={cantidaActual} class="w-full border rounded p-2" />
    </div>
  </div>

  <div>
    <label for="precioCompra" class="block mb-1 font-semibold">Precio Compra</label>
    <input id="precioCompra" type="number" step="0.01" bind:value={precioCompra} class="w-full border rounded p-2" />
  </div>

  <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
    Guardar Lote
  </button>
</form>

</div>
