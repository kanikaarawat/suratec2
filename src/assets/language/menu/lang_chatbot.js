const chatbotLang = {
    // Header
    title: { thai: 'แชทบอท', eng: 'Chatbot', japanese: 'チャットボット' },
    // Placeholders
    askAnything: { thai: 'ถามอะไรก็ได้', eng: 'Ask anything', japanese: '何でも聞いてください' },
    // Buttons
    send: { thai: 'ส่ง', eng: 'Send', japanese: '送信' },
    record: { thai: 'บันทึกเสียง', eng: 'Record', japanese: '録音' },
    stop: { thai: 'หยุด', eng: 'Stop', japanese: '停止' },
    // Toasts/Alerts
    missingAuth: { thai: 'ขาดข้อมูลยืนยันตัวตน', eng: 'Missing authentication', japanese: '認証情報が不足しています' },
    noResponse: { thai: 'ไม่มีการตอบกลับจากแชทบอท', eng: 'No response from chatbot', japanese: 'チャットボットからの応答がありません' },
    apiFailed: { thai: 'การเชื่อมต่อแชทบอทล้มเหลว', eng: 'Chatbot API failed', japanese: 'チャットボットAPIが失敗しました' },
    micPermissionDenied: { thai: 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน', eng: 'Microphone permission denied', japanese: 'マイクの許可が拒否されました' },
    recordingFailed: { thai: 'บันทึกเสียงล้มเหลว', eng: 'Recording failed', japanese: '録音に失敗しました' },
    // Voice
    voiceSent: { thai: '[ส่งข้อความเสียง]', eng: '[Voice message sent]', japanese: '[音声メッセージ送信済み]' },
    // Others
    loading: { thai: 'กำลังโหลด...', eng: 'Loading...', japanese: '読み込み中...' },
    // For audio playback
    playbackFailed: { thai: 'เล่นเสียงไม่สำเร็จ', eng: 'Playback failed', japanese: '再生に失敗しました' },
};

export default chatbotLang;
