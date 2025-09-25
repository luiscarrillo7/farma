<script>
  let dni = '';
  let password = '';

  const login = () => {
    alert(`Intentando login con DNI: ${dni}, Password: ${password}`);
  };
</script>

<h1>Login Farma</h1>

<form on:submit|preventDefault={login}>
  <input type="text" placeholder="DNI" bind:value={dni} />
  <input type="password" placeholder="Contraseña" bind:value={password} />
  <button type="submit">Ingresar</button>
</form>
