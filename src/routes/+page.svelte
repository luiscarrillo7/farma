<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let isChecking = $state(true);
  let hasChecked = $state(false); // NUEVO: Prevenir múltiples checks

  onMount(async () => {
    // OPTIMIZACIÓN: Solo verificar una vez
    if (hasChecked) return;
    hasChecked = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        goto("/dashboard");
      } else {
        goto("/login");
      }
    } catch (error) {
      console.error("Error verificando sesión:", error);
      goto("/login");
    } finally {
      isChecking = false;
    }
  });
</script>

{#if isChecking}
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600 font-semibold">Redirigiendo...</p>
    </div>
  </div>
{:else}
  <p class="text-center p-8">Redirigiendo...</p>
{/if}