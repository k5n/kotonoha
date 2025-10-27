describe('Group page', () => {
  it('should display group page elements correctly', async () => {
    // Navigate to the root group page (adjust URL if needed for default group)
    // await browser.url('/');

    // Assert page title (h1) exists and has text
    const pageTitle = await $('h1');
    await expect(pageTitle).toBeDisplayed();
    const titleText = await pageTitle.getText();
    expect(titleText).not.toBe('');

    // Assert breadcrumbs exist (check for breadcrumb container or nav element)
    const breadcrumbs = await $('nav'); // Assuming Breadcrumbs uses <nav> or similar
    await expect(breadcrumbs).toBeDisplayed();

    // Assert group grid exists (check for grid container, e.g., div with groups)
    const groupGrid = await $('.grid'); // Assuming GroupGrid uses a CSS grid class
    await expect(groupGrid).toBeDisplayed();

    // // Assert "Add New" button exists and is enabled (if not in album mode)
    // const addButton = await $('button*=Add'); // Partial text match for button
    // await expect(addButton).toBeDisplayed();
    // await expect(addButton).toBeEnabled();

    // Assert settings link (cog icon) exists
    const settingsLink = await $('a[href="/settings"]');
    await expect(settingsLink).toBeDisplayed();

    // Optional: Assert no spinner or error if page loads normally
    const spinner = await $('[class*="spinner"]'); // Adjust selector if spinner has specific class
    await expect(spinner).not.toBeDisplayed();
    const errorAlert = await $('[class*="alert"]'); // Adjust for Alert component
    await expect(errorAlert).not.toBeDisplayed();
  });
});
