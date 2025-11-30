<script lang="ts">
  import Layout from '../../routes/+layout.svelte';
  import Page from '../../routes/episode/[id]/+page.svelte';

  let props = $props();
</script>

<Layout>
  <Page {...props} />
</Layout>
