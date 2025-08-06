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
    episodeListPage: {
      addNewButton: 'エピソードを追加',
      errorPrefix: 'エラー:',
      loading: '読み込み中...',
      emptyState: {
        title: 'エピソードがありません',
        message: 'このコレクションに最初のエピソードを追加しましょう。',
        addButton: '最初のエピソードを追加',
      },
      errors: {
        fetchAlbumGroups: 'アルバムグループの取得に失敗しました',
        moveEpisode: 'エピソードの移動に失敗しました',
        deleteEpisode: 'エピソードの削除に失敗しました',
        updateName: 'エピソード名の更新に失敗しました',
      },
      confirmDelete: {
        title: 'エピソードの削除',
        message: 'エピソード「{{episodeTitle}}」を削除しますか？関連するデータも全て削除されます。',
      },
    },
    episodeDetailPage: {
      backButton: '戻る',
      errorPrefix: 'エラー:',
      playbackTime: '再生時間: {{minutes}}分 {{seconds}}秒',
      scriptTitle: 'スクリプト',
      sentenceCardsTitle: '作成したカード',
      errors: {
        analyzeFailed: '対話の分析中にエラーが発生しました。',
        createCardsFailed: 'カードの作成中にエラーが発生しました。',
      },
    },
  },
};
