<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<div class="mx-auto h-screen w-full px-4">
  {@render children()}
</div>
