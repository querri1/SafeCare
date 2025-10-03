// 治愈中心页面
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

  // 开始练习
  startExercise() {
    wx.showToast({
      title: '开始八段锦练习',
      icon: 'success'
    })
    // 这里可以跳转到练习页面
  },

  // 开始音乐疗法
  startMusicTherapy() {
    wx.showToast({
      title: '开始五音疗法',
      icon: 'success'
    })
    // 这里可以跳转到音乐疗法页面
  },

  // 开始测试
  startTest() {
    wx.showToast({
      title: '开始心理健康测试',
      icon: 'success'
    })
    // 这里可以跳转到测试页面
  },

  // 查看练习详情
  viewExerciseDetail() {
    wx.showToast({
      title: '查看练习详情',
      icon: 'success'
    })
  },

  // 开始PHQ-9测试
  startPHQ9Test() {
    wx.showToast({
      title: '开始PHQ-9测试',
      icon: 'success'
    })
    // 这里可以跳转到PHQ-9测试页面
  },

  // 开始GAD-7测试
  startGAD7Test() {
    wx.showToast({
      title: '开始GAD-7测试',
      icon: 'success'
    })
    // 这里可以跳转到GAD-7测试页面
  }
})

