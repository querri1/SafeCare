// 日期详情页面
const auth = require('../../utils/auth.js')
const emotionUtil = require('../../utils/emotion.js')
const emotionGuide = require('../../utils/emotionGuide.js')

Page({
  data: {
    dateStr: '', // 日期字符串（YYYY-MM-DD）
    dateText: '', // 日期显示文本
    emotions: [], // 情绪记录列表
    diary: null, // 日记内容
    hasCheckin: false, // 是否有打卡
    latestEmotion: null, // 最近一次情绪记录（用于显示调养建议）
    emotionGuide: null // 情绪调养指南
  },

  onLoad(options) {
    // 获取日期参数
    const dateStr = options.date || ''
    if (!dateStr) {
      wx.showToast({
        title: '日期参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ dateStr })
    
    // 格式化日期显示
    const dateParts = dateStr.split('-')
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1])
      const day = parseInt(dateParts[2])
      this.setData({
        dateText: `${year}年${month}月${day}日`
      })
    }

    // 加载数据
    this.loadDayData(dateStr)
  },

  onShow() {
    // 页面显示时重新加载数据（从日记页面返回时刷新）
    if (this.data.dateStr) {
      this.loadDayData(this.data.dateStr)
    }
  },

  // 加载日期数据
  loadDayData(dateStr) {
    if (!auth.isLoggedIn() || !wx.cloud) {
      return
    }

    const db = wx.cloud.database()
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)

    wx.showLoading({ title: '加载中...', mask: true })

    // 并行查询打卡记录、情绪记录和日记
    Promise.all([
      // 查询打卡记录
      db.collection('checkin_records')
        .where({
          date: db.command.gte(date).and(db.command.lt(tomorrow))
        })
        .get()
        .catch(() => ({ data: [] })),
      // 查询情绪记录
      db.collection('emotion_records')
        .where({
          date: db.command.gte(date).and(db.command.lt(tomorrow))
        })
        .get()
        .catch(() => ({ data: [] })),
      // 查询日记
      db.collection('emotion_diary')
        .where({
          date: db.command.gte(date).and(db.command.lt(tomorrow))
        })
        .get()
        .catch(() => ({ data: [] }))
    ]).then(([checkinRes, emotionRes, diaryRes]) => {
      wx.hideLoading()

      const hasCheckin = checkinRes.data && checkinRes.data.length > 0
      const emotionRecords = emotionRes.data || []
      
      // 处理情绪记录，按创建时间排序，取最近一条
      const emotions = emotionRecords
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime()
          const timeB = new Date(b.createdAt || 0).getTime()
          return timeB - timeA // 降序，最新的在前
        })
        .map(record => {
          const display = emotionUtil.getEmotionDisplay(record.emotion, record.level)
          const activityName = record.activityType === 'baduanjin' ? '健身操' : '五音疗法'
          const emoji = emotionUtil.EMOTION_CONFIG[record.emotion]?.emoji[record.level] || ''
          return {
            display: display,
            emoji: emoji,
            activityName: activityName,
            emotion: record.emotion,
            level: record.level,
            createdAt: record.createdAt
          }
        })
      
      // 获取最近一次情绪记录（用于显示调养建议）
      // 重要：只要有情绪记录就显示调养指南，完全不依赖日记
      let emotionGuideData = null
      const latestEmotion = emotions.length > 0 ? emotions[0] : null
      if (latestEmotion && latestEmotion.emotion) {
        emotionGuideData = emotionGuide.getEmotionGuide(latestEmotion.emotion)
      }

      const diaries = diaryRes.data || []
      const diary = diaries.length > 0 ? diaries[0] : null

      // 设置数据：调养指南只依赖情绪记录，不依赖日记
      this.setData({
        hasCheckin,
        emotions,
        diary,
        latestEmotion: emotions.length > 0 ? emotions[0] : null,
        emotionGuide: emotionGuideData // 只要有情绪记录就会设置，完全不依赖日记
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('加载日期数据失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 编辑日记
  editDiary() {
    const { dateStr } = this.data
    wx.navigateTo({
      url: `/pages/emotion-diary/emotion-diary?date=${dateStr}`
    })
  },

  // 写日记
  writeDiary() {
    const { dateStr } = this.data
    wx.navigateTo({
      url: `/pages/emotion-diary/emotion-diary?date=${dateStr}`
    })
  }
})

