<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let medicamentos = [];
  let proveedores = [];

  // Datos del formulario
  let medicamentoId = "";
  let proveedorId = "";
  let fechaIngreso = "";
  let fechaVencimiento = "";
  let cantidadInicial = 0;
  let cantidadActual = 0;
  let precioCompra = 0;

  // Cargar combos desde la API
  onMount(async () => {
    const resMed = await fetch("https://farmacia-269414280318.europe-west1.run.app/medicamentos");
    medicamentos = await resMed.json();

    const resProv = await fetch("https://farmacia-269414280318.europe-west1.run.app/proveedores");
    proveedores = await resProv.json();
  });

  async function agregarLote() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const response = await fetch("https://farmacia-269414280318.europe-west1.run.app/lotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        medicamento_id: medicamentoId,
        proveedor_id: proveedorId,
        fecha_ingreso: fechaIngreso,
        fecha_vencimiento: fechaVencimiento,
        cantidad_inicial: cantidadInicial,
        cantidad_actual: cantidadActual,
        precio_compra: precioCompra
      })
    });

    if (response.ok) {
      alert("✅ Lote agregado con éxito");
      goto("/inventario"); // refrescar la vista
    } else {
      try {
        const error = await response.json();
        alert("❌ Error: " + (error.detail || "Error al guardar el lote"));
      } catch (e) {
        alert("❌ Error inesperado en el servidor (500)");
      }
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
      <select id="proveedor" bind:value={proveedorId} class="w-full border rounded p-2">
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
        <label for="cantidadInicial" class="block mb-1 font-semibold">Cantidad Inicial</label>
        <input id="cantidadInicial" type="number" bind:value={cantidadInicial} class="w-full border rounded p-2" />
      </div>
      <div>
        <label for="cantidadActual" class="block mb-1 font-semibold">Cantidad Actual</label>
        <input id="cantidadActual" type="number" bind:value={cantidadActual} class="w-full border rounded p-2" />
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
