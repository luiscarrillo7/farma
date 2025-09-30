<!-- routes/inventario/+page.svelte -->

<script>
  import { goto } from '$app/navigation';

  function volverDashboard() {
    goto('/');
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
  <h1 class="text-3xl font-bold mb-6">Página Inventario</h1>
  <p class="text-gray-600 mb-8">Esta es una página en blanco de prueba.</p>

  <div class="flex gap-4">
    <!-- Link como <a> -->
    <a 
      href="/" 
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
      Ir al Dashboard
    </a>

    <!-- Botón con goto -->
    <button 
      onclick={volverDashboard} 
      class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg">
      Volver con goto()
    </button>
  </div>
</div>
