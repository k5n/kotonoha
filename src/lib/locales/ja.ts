export const ja = {
  translation: {
    settings: {
      title: '設定',
      backButton: '戻る',
      apiKey: {
        label: 'Gemini API Key',
        placeholder: 'APIキーを入力',
        alreadySet: 'APIキーは設定済みです。',
        overwriteWarning: '新しいキーを保存すると上書きされます。',
        notSet: 'APIキーは設定されていません。',
        notSetWarning: '機能を利用するにはAPIキーの登録が必要です。',
      },
      saveButton: {
        label: '保存',
        saving: '保存中...',
      },
      notifications: {
        saveSuccess: 'APIキーを保存しました。',
        saveError: 'APIキーの保存に失敗しました。',
        loadError: '設定が読み込まれていません。',
        apiKeyRequired: 'APIキーを入力してください。',
      },
    },
    groupPage: {
      title: 'グループ一覧',
      addNewButton: '新規追加',
      errorPrefix: 'エラー:',
      errors: {
        updateOrder: 'グループの並び替えに失敗しました。',
        updateName: 'グループ名の更新に失敗しました。',
        fetchParents: '移動先グループの取得に失敗しました。',
        moveGroup: 'グループの移動に失敗しました。',
        deleteGroup: 'グループの削除に失敗しました。',
      },
      confirmDelete: {
        message:
          'グループ「{{groupName}}」を削除しますか？このグループの子グループやエピソード、センテンスマイニングしたカードも全て削除され、この操作は元に戻せません。',
      },
    },
  },
};
