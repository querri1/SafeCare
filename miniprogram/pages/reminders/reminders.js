// 提醒设置页面
const auth = require('../../utils/auth.js')

Page({
  data: {
    hasLogin: false,
    // 提醒设置
    baduanjinReminder: false,
    baduanjinTime: '08:00',
    musicReminder: false,
    musicTime: '20:00',
    testReminder: false,
    testTime: '19:00'
  },

  onLoad() {
    this.checkLoginAndLoadSettings()
  },

  onShow() {
    this.checkLoginAndLoadSettings()
  },

  // 检查登录状态并加载设置
  checkLoginAndLoadSettings() {
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ hasLogin: isLoggedIn })
    
    if (isLoggedIn) {
      this.loadSettings()
    }
  },

  // 从本地存储加载设置
  loadSettings() {
    const settings = wx.getStorageSync('reminderSettings') || {}
    this.setData({
      baduanjinReminder: settings.baduanjinReminder || false,
      baduanjinTime: settings.baduanjinTime || '08:00',
      musicReminder: settings.musicReminder || false,
      musicTime: settings.musicTime || '20:00',
      testReminder: settings.testReminder || false,
      testTime: settings.testTime || '19:00'
    })
  },

  // 保存设置
  saveSettings() {
    const settings = {
      baduanjinReminder: this.data.baduanjinReminder,
      baduanjinTime: this.data.baduanjinTime,
      musicReminder: this.data.musicReminder,
      musicTime: this.data.musicTime,
      testReminder: this.data.testReminder,
      testTime: this.data.testTime
    }
    wx.setStorageSync('reminderSettings', settings)
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    })
  },

  // 切换健身操提醒
  toggleBaduanjinReminder(e) {
    this.setData({
      baduanjinReminder: e.detail.value
    })
    this.saveSettings()
  },

  // 切换五音疗法提醒
  toggleMusicReminder(e) {
    this.setData({
      musicReminder: e.detail.value
    })
    this.saveSettings()
  },

  // 切换测试提醒
  toggleTestReminder(e) {
    this.setData({
      testReminder: e.detail.value
    })
    this.saveSettings()
  },

  // 选择健身操时间
  selectBaduanjinTime(e) {
    this.setData({
      baduanjinTime: e.detail.value
    })
    this.saveSettings()
  },

  // 选择五音疗法时间
  selectMusicTime(e) {
    this.setData({
      musicTime: e.detail.value
    })
    this.saveSettings()
  },

  // 选择测试时间
  selectTestTime(e) {
    this.setData({
      testTime: e.detail.value
    })
    this.saveSettings()
  }
})

