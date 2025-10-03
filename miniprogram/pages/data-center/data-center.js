// 数据中心页面
Page({
  data: {
    currentPeriod: 'week'
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  onShow() {
    // 页面显示时的逻辑
  },

  // 切换图表周期
  switchChartPeriod(e) {
    const period = e.currentTarget.dataset.period
    this.setData({
      currentPeriod: period
    })
    
    wx.showToast({
      title: `切换到${period === 'week' ? '周' : '月'}视图`,
      icon: 'success'
    })
  },

  // 查看所有记录
  viewAllRecords() {
    wx.showToast({
      title: '查看所有测试记录',
      icon: 'success'
    })
    // 这里可以跳转到记录列表页面
  },

  // 查看记录详情
  viewRecordDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: `查看记录详情 ${id}`,
      icon: 'success'
    })
    // 这里可以跳转到记录详情页面
  }
})

