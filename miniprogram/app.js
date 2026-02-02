// app.js
App({
  globalData: {
    userInfo: null,
    openid: null
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云开发能力')
      wx.showToast({
        title: '云开发初始化失败',
        icon: 'none',
        duration: 2000
      })
    } else {
      try {
        wx.cloud.init({
          env: 'cloud1-4ghau10w942b2505',
          traceUser: true
        })
        console.log('云开发初始化成功')
      } catch (err) {
        console.error('云开发初始化错误:', err)
        wx.showToast({
          title: '云开发初始化失败',
          icon: 'none',
          duration: 2000
        })
      }
    }

    // 可以保留日志逻辑
    try {
      const logs = wx.getStorageSync('logs') || []
      logs.unshift(Date.now())
      wx.setStorageSync('logs', logs)
    } catch (err) {
      console.error('日志保存失败:', err)
    }

    // 启用分享功能（转发给朋友和分享到朋友圈）
    try {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    } catch (err) {
      console.error('启用分享菜单失败:', err)
    }
  },

  onError(err) {
    console.error('小程序全局错误:', err)
    // 过滤掉框架内部错误，只显示用户代码错误
    if (err && typeof err === 'string') {
      // 忽略框架内部错误
      if (err.includes('not node js file system') || 
          err.includes('wxfile://') ||
          err.includes('backgroundfetch') ||
          err.includes('miniprogramLog') ||
          err.includes('cmdld')) {
        return // 忽略这些错误
      }
    }
    // 其他错误可以在这里处理或上报
  }
})

