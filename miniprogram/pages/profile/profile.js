// 个人中心页面
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  onShow() {
    // 页面显示时的逻辑
  },

  // 导航到我的数据
  navigateToMyData() {
    wx.showToast({
      title: '跳转到我的数据',
      icon: 'success'
    })
    // 这里可以跳转到数据详情页面
  },

  // 导航到成就徽章
  navigateToAchievements() {
    wx.showToast({
      title: '跳转到成就徽章',
      icon: 'success'
    })
    // 这里可以跳转到成就页面
  },

  // 导航到打卡日历
  navigateToCalendar() {
    wx.showToast({
      title: '跳转到打卡日历',
      icon: 'success'
    })
    // 这里可以跳转到日历页面
  },

  // 导航到提醒设置
  navigateToReminders() {
    wx.showToast({
      title: '跳转到提醒设置',
      icon: 'success'
    })
    // 这里可以跳转到设置页面
  },

  // 导航到隐私设置
  navigateToPrivacy() {
    wx.showToast({
      title: '跳转到隐私设置',
      icon: 'success'
    })
    // 这里可以跳转到隐私设置页面
  },

  // 导航到帮助与反馈
  navigateToHelp() {
    wx.showToast({
      title: '跳转到帮助与反馈',
      icon: 'success'
    })
    // 这里可以跳转到帮助页面
  }
})

