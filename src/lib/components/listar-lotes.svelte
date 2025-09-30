<script>
  import { onMount } from 'svelte';
  export let refrescar; // recibe prop para volver a cargar

  let lotes = [];
  let cargando = true;
  let error = null;

  async function cargarLotes() {
    cargando = true;
    try {
      const res = await fetch("https://farmacia-269414280318.europe-west1.run.app/lotes");
      if (!res.ok) throw new Error("Error al cargar los lotes");
      lotes = await res.json();
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  }

  onMount(cargarLotes);
  $: refrescar, cargarLotes(); // cuando refrescar cambie, recarga los lotes
</script>
