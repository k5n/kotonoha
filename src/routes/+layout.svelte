<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-100">
  <div class="mx-auto h-screen max-w-screen-2xl bg-white px-4">
    {@render children()}
  </div>
</div>
