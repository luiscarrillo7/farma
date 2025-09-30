<script>
  import IngresoMedicamento from '$lib/components/ingreso-medicamento.svelte';
  import ListarLotes from '$lib/components/listar-lotes.svelte';

  let refrescar = false;

  function recargarLotes() {
    refrescar = !refrescar; // cambia estado para forzar actualización en la tabla
  }
</script>

<div class="space-y-8">
  <IngresoMedicamento on:loteAgregado={recargarLotes} />
  <ListarLotes {refrescar} />
</div>
