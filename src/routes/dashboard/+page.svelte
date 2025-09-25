<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let user = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto("/login");
    } else {
      user = session.user;
    }
  });

  async function logout() {
    await supabase.auth.signOut();
    goto("/login");
  }
</script>

{#if user}
  <div>
    <header class="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
      <h1 class="text-2xl font-bold">Bienvenido {user.email}</h1>
      <button on:click={logout} class="bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-lg">Salir</button>
    </header>

    <main class="p-8 text-center">
      <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl">
        🛒 Registrar Nueva Venta
      </button>
    </main>
  </div>
{/if}
