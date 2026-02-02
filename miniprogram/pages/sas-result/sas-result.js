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
  },

  // 转发给朋友
  onShareAppMessage(options) {
    const severity = this.data.severity || '正常'
    return {
      title: `我的心理健康测试结果：${severity} - 安心宝`,
      path: `/pages/sas-result/sas-result?score=${this.data.score}&rawScore=${this.data.rawScore}&severity=${this.data.severity}&progress=${this.data.progress}&title=${encodeURIComponent(this.data.title)}&desc=${encodeURIComponent(this.data.desc)}&color=${this.data.color}`,
      imageUrl: '' // 可选：分享图片
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '关注心理健康，定期自我评估 - 安心宝',
      query: '',
      imageUrl: '' // 可选：分享图片
    }
  }
})

