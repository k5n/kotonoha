<script lang="ts">
  import type { AppInfo } from '$lib/domain/entities/appInfo';

  interface AppInfoComponentProps {
    appInfo: AppInfo;
  }

  let { appInfo }: AppInfoComponentProps = $props();
</script>

<div class="mt-8 border-t border-gray-200 pt-4">
  <h2 class="mb-2 text-lg font-semibold">
    {appInfo.name}
  </h2>
  <div class="space-y-1 text-sm text-gray-500">
    <div>Version: {appInfo.version}</div>
    <div>Copyright: {appInfo.copyright}</div>
    <div>License: {appInfo.license}</div>
    <div>
      Homepage:
      <a href={appInfo.homepage} target="_blank" rel="noopener" class="text-blue-600 underline"
        >{appInfo.homepage}</a
      >
    </div>
  </div>
</div>
