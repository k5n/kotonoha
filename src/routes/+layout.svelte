<script>
  let { children } = $props();
  import '../app.css';
</script>

<div class="container mx-auto px-4">
  {@render children()}
</div>
