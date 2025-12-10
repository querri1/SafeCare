// 情绪选择页面
const emotionUtil = require('../../utils/emotion.js')

Page({
  data: {
    activityType: '', // 活动类型
    selectedEmotion: null, // 选中的情绪类型
    selectedLevel: null, // 选中的情绪等级
    emotionList: [] // 情绪列表
  },

  onLoad(options) {
    const activityType = options.activityType || ''
    this.setData({ activityType })

    // 构建情绪列表
    const emotionList = []
    const { EMOTION_TYPES, EMOTION_LEVELS, EMOTION_CONFIG } = emotionUtil

    Object.keys(EMOTION_CONFIG).forEach(emotionType => {
      const config = EMOTION_CONFIG[emotionType]
      const levels = [
        { value: EMOTION_LEVELS.LOW, emoji: config.emoji[EMOTION_LEVELS.LOW], text: config.text[EMOTION_LEVELS.LOW] },
        { value: EMOTION_LEVELS.MEDIUM, emoji: config.emoji[EMOTION_LEVELS.MEDIUM], text: config.text[EMOTION_LEVELS.MEDIUM] },
        { value: EMOTION_LEVELS.HIGH, emoji: config.emoji[EMOTION_LEVELS.HIGH], text: config.text[EMOTION_LEVELS.HIGH] }
      ]

      emotionList.push({
        type: emotionType,
        name: config.name,
        levels: levels
      })
    })

    this.setData({ emotionList })
  },

  // 选择情绪
  selectEmotion(e) {
    const emotion = e.currentTarget.dataset.emotion
    const level = e.currentTarget.dataset.level

    this.setData({
      selectedEmotion: emotion,
      selectedLevel: level
    })
  },

  // 确认选择
  confirm() {
    if (!this.data.selectedEmotion || !this.data.selectedLevel) {
      wx.showToast({
        title: '请选择心情',
        icon: 'none'
      })
      return
    }

    // 通过全局回调返回结果
    const app = getApp()
    if (app.emotionSelectorCallback) {
      app.emotionSelectorCallback({
        emotion: this.data.selectedEmotion,
        level: this.data.selectedLevel
      })
    }

    // 返回上一页
    wx.navigateBack()
  },

  // 取消
  cancel() {
    const app = getApp()
    if (app.emotionSelectorCallback) {
      app.emotionSelectorCallback(null)
    }
    wx.navigateBack()
  }
})

