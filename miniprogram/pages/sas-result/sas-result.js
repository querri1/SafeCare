// SAS结果页面
Page({
  data: {
    score: 0,
    rawScore: 0,
    severity: '',
    progress: 0,
    title: '',
    desc: '',
    color: '#34D399'
  },

  onLoad(options) {
    const score = parseInt(options.score) || 0
    const rawScore = parseInt(options.rawScore) || 0
    const severity = options.severity || '正常'
    const progress = parseFloat(options.progress) || 0
    const title = decodeURIComponent(options.title || '')
    const desc = decodeURIComponent(options.desc || '')
    const color = options.color || '#34D399'

    this.setData({
      score,
      rawScore,
      severity,
      progress,
      title,
      desc,
      color
    })
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/healing-center/healing-center'
    })
  },

  // 查看历史记录
  viewHistory() {
    wx.navigateTo({
      url: '/pages/test-records/test-records?range=all'
    })
  }
})

