export const en = {
  translation: {
    settings: {
      title: 'Settings',
      backButton: 'Back',
      apiKey: {
        label: 'Gemini API Key',
        placeholder: 'Enter API Key',
        alreadySet: 'API key is already set.',
        overwriteWarning: 'Saving a new key will overwrite the existing one.',
        notSet: 'API key is not set.',
        notSetWarning: 'API key is required to use the features.',
      },
      saveButton: {
        label: 'Save',
        saving: 'Saving...',
      },
      notifications: {
        saveSuccess: 'API key saved successfully.',
        saveError: 'Failed to save API key.',
        loadError: 'Settings are not loaded.',
        apiKeyRequired: 'Please enter an API key.',
      },
    },
    groupPage: {
      title: 'Group List',
      addNewButton: 'Add New',
      errorPrefix: 'Error:',
      errors: {
        updateOrder: 'Failed to update group order.',
        updateName: 'Failed to update group name.',
        fetchParents: 'Failed to fetch destination groups.',
        moveGroup: 'Failed to move group.',
        deleteGroup: 'Failed to delete group.',
      },
      confirmDelete: {
        message:
          'Are you sure you want to delete the group "{{groupName}}"? All child groups, episodes, and sentence mining cards within this group will also be deleted. This action cannot be undone.',
      },
    },
  },
};
