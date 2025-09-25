<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      goto("/dashboard");
    } else {
      goto("/login");
    }
  });
</script>

<p>Redirigiendo...</p>
