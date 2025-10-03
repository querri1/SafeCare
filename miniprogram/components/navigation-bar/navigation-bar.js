// 导航栏组件
Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: false
    },
    color: {
      type: String,
      value: '#000000'
    },
    background: {
      type: String,
      value: '#ffffff'
    }
  },

  data: {
    safeAreaTop: '0px'
  },

  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync()
      this.setData({
        safeAreaTop: systemInfo.safeArea ? `${systemInfo.safeArea.top}px` : '0px'
      })
    }
  },

  methods: {
    // 返回上一页
    back() {
      wx.navigateBack({
        delta: 1
      })
    }
  }
})

