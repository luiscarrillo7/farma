<!-- routes/inventario/+page.svelte -->

<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let session = $state(null);

  // Verificar sesión al cargar la página
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    if (!session) goto('/login'); // Si no hay sesión, redirige al login
  });

  async function logout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<div class="min-h-screen bg-gray-100">
  <header class="bg-purple-800 text-white p-4 shadow-lg flex justify-between items-center">
    <h1 class="text-2xl font-bold">Inventario</h1>
    <div class="flex gap-4">
      <a 
        href="/" 
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
        Dashboard
      </a>
      <button 
        onclick={logout} 
        class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">
        Salir
      </button>
    </div>
  </header>

  <main class="p-8">
    {#if session}
      <div class="text-center">
        <h2 class="text-xl font-semibold mb-4">📦 Gestión de Inventario</h2>
        <p class="text-gray-600">
          Esta es una página en blanco protegida.  
          Aquí podrás manejar productos, lotes y movimientos de stock.
        </p>
      </div>
    {/if}
  </main>
</div>
