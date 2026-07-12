<template>
  <main class="page">
    <section class="panel">
      <h1>Gosei Test Page</h1>
      <p>Routing works. Beautiful. Disgustingly productive already.</p>

      <RouterLink to="/" class="button">
        Back home
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b0d14;
  color: white;
}

.panel {
  padding: 2rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
}

.button {
  color: #9da8ff;
}
</style>
