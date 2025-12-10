// 隐私设置页面
const auth = require('../../utils/auth.js')

Page({
  data: {
    hasLogin: false,
    // 隐私设置
    dataSync: true, // 数据同步
    analytics: true, // 数据分析
    shareData: false // 分享数据用于改进
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
    const settings = wx.getStorageSync('privacySettings') || {}
    this.setData({
      dataSync: settings.dataSync !== undefined ? settings.dataSync : true,
      analytics: settings.analytics !== undefined ? settings.analytics : true,
      shareData: settings.shareData || false
    })
  },

  // 保存设置
  saveSettings() {
    const settings = {
      dataSync: this.data.dataSync,
      analytics: this.data.analytics,
      shareData: this.data.shareData
    }
    wx.setStorageSync('privacySettings', settings)
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    })
  },

  // 切换数据同步
  toggleDataSync(e) {
    this.setData({
      dataSync: e.detail.value
    })
    this.saveSettings()
  },

  // 切换数据分析
  toggleAnalytics(e) {
    this.setData({
      analytics: e.detail.value
    })
    this.saveSettings()
  },

  // 切换数据分享
  toggleShareData(e) {
    this.setData({
      shareData: e.detail.value
    })
    this.saveSettings()
  },

  // 清除所有数据
  clearAllData() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有本地数据吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          // 清除所有本地存储（除了登录信息）
          const openid = wx.getStorageSync('openid')
          const userInfo = wx.getStorageSync('userInfo')
          wx.clearStorageSync()
          if (openid) wx.setStorageSync('openid', openid)
          if (userInfo) wx.setStorageSync('userInfo', userInfo)
          
          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          })
        }
      }
    })
  }
})

