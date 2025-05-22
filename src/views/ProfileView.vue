<template>
  <div class="profile">
    <div class="profile__container">
      <h1>Profile</h1>
      <div class="profile__content">
        <div class="profile__info">
          <h2>User Information</h2>
          <p>Coming soon...</p>
        </div>
        <div class="profile__preferences">
          <h2>Preferences</h2>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component logic will be added here
</script>

<style lang="scss" scoped>
.profile {
  padding: 2rem;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    color: var(--primary-color);
    margin-bottom: 2rem;
  }

  &__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  &__info,
  &__preferences {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h2 {
      color: var(--secondary-color);
      margin-bottom: 1rem;
    }
  }
}
</style>
