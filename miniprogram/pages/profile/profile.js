// 个人中心页面
// 目标：基于云开发实现「微信一键登录 + 自动注册」能力
// 数据存储：云开发数据库集合 `users`
const app = getApp()

Page({
  data: {
    hasLogin: false,
    userInfo: null,
    consecutiveDays: 0, // 连续打卡天数
    totalCheckins: 0 // 总打卡次数
  },

  onLoad() {
    // 页面加载时尝试从本地和云端恢复登录态
    this.initUserFromStorage()
    this.loadUserStats()
  },

  onShow() {
    // 每次进入页面，如果还没登录，可以在这里决定是否自动拉起登录
    this.loadUserStats()
  },

  // 加载用户统计数据
  loadUserStats() {
    if (!this.data.hasLogin || !wx.cloud) {
      this.setData({
        consecutiveDays: 0,
        totalCheckins: 0
      })
      return
    }

    const db = wx.cloud.database()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 加载总打卡次数
    db.collection('checkin_records')
      .count()
      .then(res => {
        this.setData({ totalCheckins: res.total })
      })
      .catch(err => {
        console.error('查询总打卡次数失败', err)
      })

    // 加载连续打卡天数
    db.collection('checkin_records')
      .orderBy('date', 'desc')
      .get()
      .then(res => {
        if (!res.data || res.data.length === 0) {
          this.setData({ consecutiveDays: 0 })
          return
        }

        let consecutive = 0
        let checkDate = new Date(today)
        
        const todayRecord = res.data.find(record => {
          const recordDate = new Date(record.date)
          recordDate.setHours(0, 0, 0, 0)
          return recordDate.getTime() === checkDate.getTime()
        })
        
        if (!todayRecord) {
          this.setData({ consecutiveDays: 0 })
          return
        }
        
        consecutive = 1
        checkDate.setDate(checkDate.getDate() - 1)
        
        for (let i = 0; i < res.data.length; i++) {
          const record = res.data[i]
          const recordDate = new Date(record.date)
          recordDate.setHours(0, 0, 0, 0)
          
          if (recordDate.getTime() === checkDate.getTime()) {
            consecutive++
            checkDate.setDate(checkDate.getDate() - 1)
          } else if (recordDate.getTime() < checkDate.getTime()) {
            break
          }
        }

        this.setData({ consecutiveDays: consecutive })
      })
      .catch(err => {
        console.error('查询连续打卡天数失败', err)
      })
  },

  // 从本地缓存初始化用户
  initUserFromStorage() {
    const auth = require('../../utils/auth.js')
    if (auth.initLoginState()) {
      this.setData({
        hasLogin: true,
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 主动发起微信登录（推荐在按钮上绑定）
  // ⚠️ 重要：wx.getUserProfile 必须在用户点击事件中直接调用，不能在异步回调中调用
  handleLogin() {
    if (!wx.cloud) {
      wx.showToast({
        title: '请升级基础库版本',
        icon: 'none'
      })
      return
    }

    // 检查是否已登录
    if (this.data.hasLogin) {
      wx.showToast({
        title: '您已登录',
        icon: 'none'
      })
      return
    }

    // ⚠️ 必须在点击事件中直接调用 wx.getUserProfile
    wx.getUserProfile({
      desc: '用于完善个人资料',
      success: async (profileRes) => {
        wx.showLoading({ title: '登录中...', mask: true })
        
        try {
          const wxUserInfo = profileRes.userInfo
          
          // 获取 openid
          const loginRes = await this.getOpenid()
          const openid = loginRes.openid
          
          if (!openid) {
            throw new Error('未获取到 openid')
          }

          console.log('成功获取 openid:', openid)
          app.globalData.openid = openid
          wx.setStorageSync('openid', openid)

          // 保存用户信息到数据库
          await this.saveOrUpdateUser(openid, wxUserInfo)
          
          wx.hideLoading()
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
        } catch (err) {
          console.error('登录过程出错:', err)
          wx.hideLoading()
          wx.showToast({
            title: err.message || '登录失败，请稍后重试',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('wx.getUserProfile 失败：', err)
        wx.showToast({
          title: err.errMsg || '授权失败',
          icon: 'none'
        })
      }
    })
  },

  // 获取 openid（封装为独立方法）
  getOpenid() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login'
      }).then(res => {
        console.log('云函数 login 返回结果:', res)
        console.log('res.result:', res.result)
        
        // 检查返回结构
        if (!res || !res.result) {
          console.error('云函数返回结构异常:', res)
          reject(new Error('云函数返回数据异常'))
          return
        }
        
        // 检查是否有错误
        if (res.result.errCode !== undefined && res.result.errCode !== 0) {
          console.error('云函数返回错误:', res.result.errMsg)
          reject(new Error(res.result.errMsg || '云函数执行失败'))
          return
        }
        
        // 兼容两种返回结构
        let openid = res.result.openid || (res.result.userInfo && res.result.userInfo.openId)
        
        if (!openid) {
          console.error('未获取到 openid，完整返回:', JSON.stringify(res.result))
          reject(new Error('未获取到 openid'))
          return
        }

        resolve({ openid })
      }).catch(err => {
        console.error('云函数 login 调用失败', err)
        reject(err)
      })
    })
  },

  // 在云开发数据库中创建或更新用户
  async saveOrUpdateUser(openid, wxUserInfo) {
    const db = wx.cloud.database()
    const users = db.collection('users')

    try {
      // 查询是否已存在
      const queryRes = await users.where({ _openid: openid }).get()

      let userDoc = null

      if (queryRes.data && queryRes.data.length > 0) {
        // 用户已存在：完全保留用户自己修改的头像、昵称和年龄，只更新其他信息
        const existingUser = queryRes.data[0]
        const docId = existingUser._id
        
        // 只更新其他信息，不覆盖用户自定义的头像、昵称和年龄
        await users.doc(docId).update({
          data: {
            gender: wxUserInfo.gender,
            country: wxUserInfo.country,
            province: wxUserInfo.province,
            city: wxUserInfo.city,
            updatedAt: new Date()
          }
        })
        
        // 保留原有的头像、昵称和年龄
        userDoc = { 
          ...existingUser,
          gender: wxUserInfo.gender,
          country: wxUserInfo.country,
          province: wxUserInfo.province,
          city: wxUserInfo.city,
          updatedAt: new Date()
        }
      } else {
        // 首次登录：使用微信的头像和昵称，年龄默认为空
        const baseData = {
          nickName: wxUserInfo.nickName,
          avatarUrl: wxUserInfo.avatarUrl,
          gender: wxUserInfo.gender,
          country: wxUserInfo.country,
          province: wxUserInfo.province,
          city: wxUserInfo.city,
          age: null, // 年龄需要用户手动设置
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const addRes = await users.add({
          data: baseData
        })
        userDoc = {
          _id: addRes._id,
          ...baseData
        }
      }

      // 使用工具函数设置登录状态
      const auth = require('../../utils/auth.js')
      auth.setLoginState(openid, userDoc)

      this.setData({
        hasLogin: true,
        userInfo: userDoc
      })
      
      // 登录成功后，通知其他页面重新加载数据
      this.notifyPagesReload()
    } catch (e) {
      console.error('保存用户失败', e)
      throw e // 抛出错误，让调用者处理
    }
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？退出后数据将被重置。',
      success: (res) => {
        if (res.confirm) {
          const auth = require('../../utils/auth.js')
          // 清除所有用户数据
          auth.clearUserData()
          
          this.setData({
            hasLogin: false,
            userInfo: null
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          
          // 通知其他页面数据已重置（通过事件或页面栈）
          // 由于小程序页面栈的限制，这里通过重新加载页面来实现
          // 或者可以跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/healing-center/healing-center'
            })
          }, 1500)
        }
      }
    })
  },

  // 以下导航函数可以在登录后使用

  // 导航到我的数据
  navigateToMyData() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/my-data/my-data'
    })
  },

  // 导航到成就徽章
  navigateToAchievements() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    })
  },

  // 导航到打卡日历
  navigateToCalendar() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/checkin-calendar/checkin-calendar'
    })
  },

  // 导航到提醒设置
  navigateToReminders() {
    wx.navigateTo({
      url: '/pages/reminders/reminders'
    })
  },

  // 导航到隐私设置
  navigateToPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  // 导航到帮助与反馈
  navigateToHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    })
  },

  // 通知其他页面重新加载数据
  notifyPagesReload() {
    // 通过页面栈通知其他页面
    const pages = getCurrentPages()
    pages.forEach(page => {
      // 检查页面路由并调用刷新方法
      if (page.route && (
          page.route.includes('data-center') || 
          page.route.includes('healing-center'))) {
        if (typeof page.onLoginSuccess === 'function') {
          page.onLoginSuccess()
        } else if (typeof page.checkLoginAndLoadData === 'function') {
          page.checkLoginAndLoadData()
        }
      }
    })
  },

  // 编辑头像
  handleEditAvatar() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 从相册选择
          this.chooseImage()
        } else if (res.tapIndex === 1) {
          // 拍照
          this.chooseImage('camera')
        }
      }
    })
  },

  // 选择图片
  chooseImage(sourceType = 'album') {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [sourceType],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadAvatar(tempFilePath)
      },
      fail: (err) => {
        console.error('选择图片失败', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 上传头像到云存储
  async uploadAvatar(filePath) {
    wx.showLoading({ title: '上传中...', mask: true })

    try {
      const auth = require('../../utils/auth.js')
      const openid = auth.getOpenid()
      
      if (!openid) {
        throw new Error('未获取到用户信息，请重新登录')
      }

      if (!wx.cloud) {
        throw new Error('云开发未初始化')
      }

      // 生成云存储路径
      const cloudPath = `avatars/${openid}_${Date.now()}.jpg`
      
      // 上传到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })

      console.log('头像上传成功', uploadRes)

      // 云存储的 fileID 可以直接作为图片源使用
      const avatarUrl = uploadRes.fileID

      // 更新数据库
      await this.updateUserAvatar(openid, avatarUrl, uploadRes.fileID)

      wx.hideLoading()
      wx.showToast({
        title: '头像更新成功',
        icon: 'success'
      })
      
      // 刷新用户信息显示
      this.initUserFromStorage()
    } catch (err) {
      console.error('上传头像失败', err)
      wx.hideLoading()
      
      // 解析错误信息
      let errorMsg = '上传失败，请稍后重试'
      let showModal = false
      
      if (err.errCode) {
        // 云开发错误码
        if (err.errCode === -503002 || err.errCode === 'STORAGE_EXCEED_AUTHORITY') {
          errorMsg = '云存储权限不足'
          showModal = true
        } else if (err.errCode === -1) {
          errorMsg = '网络错误，请检查网络连接'
        } else if (err.errCode === -404006) {
          errorMsg = '文件不存在或路径错误'
        } else {
          errorMsg = `上传失败：${err.errMsg || err.message || '未知错误'}`
        }
      } else if (err.message) {
        errorMsg = err.message
      }
      
      if (showModal) {
        wx.showModal({
          title: '上传失败',
          content: '头像上传需要云存储写入权限。请检查云开发控制台中的存储权限设置，确保允许用户上传文件。\n\n如果问题持续，请联系开发者。',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#34D399'
        })
      } else {
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        })
      }
    }
  },

  // 更新用户头像
  async updateUserAvatar(openid, avatarUrl, fileID) {
    const db = wx.cloud.database()
    const users = db.collection('users')

    try {
      // 查询用户
      const queryRes = await users.where({ _openid: openid }).get()
      
      if (queryRes.data && queryRes.data.length > 0) {
        const docId = queryRes.data[0]._id
        // 更新头像
        await users.doc(docId).update({
          data: {
            avatarUrl: avatarUrl,
            avatarFileID: fileID, // 保存云存储文件ID，方便后续使用
            updatedAt: new Date()
          }
        })

        // 更新本地数据
        const updatedUserInfo = {
          ...this.data.userInfo,
          avatarUrl: avatarUrl,
          avatarFileID: fileID
        }

        const auth = require('../../utils/auth.js')
        auth.setLoginState(openid, updatedUserInfo)

        this.setData({
          userInfo: updatedUserInfo
        })

        // 更新全局数据
        const app = getApp()
        app.globalData.userInfo = updatedUserInfo
      } else {
        throw new Error('用户不存在')
      }
    } catch (err) {
      console.error('更新头像失败', err)
      throw err
    }
  },

  // 编辑昵称
  handleEditNickname() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const currentNickname = this.data.userInfo?.nickName || ''

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: currentNickname,
      success: async (res) => {
        if (res.confirm) {
          const newNickname = res.content.trim()
          
          if (!newNickname) {
            wx.showToast({
              title: '昵称不能为空',
              icon: 'none'
            })
            return
          }

          if (newNickname.length > 20) {
            wx.showToast({
              title: '昵称不能超过20个字符',
              icon: 'none'
            })
            return
          }

          // 更新昵称
          await this.updateUserNickname(newNickname)
        }
      }
    })
  },

  // 编辑年龄
  handleEditAge() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const currentAge = this.data.userInfo?.age || ''

    wx.showModal({
      title: '修改年龄',
      editable: true,
      placeholderText: '请输入年龄（1-120）',
      content: currentAge ? String(currentAge) : '',
      success: async (res) => {
        if (res.confirm) {
          const ageStr = res.content.trim()
          
          if (!ageStr) {
            wx.showToast({
              title: '年龄不能为空',
              icon: 'none'
            })
            return
          }

          const age = parseInt(ageStr)
          
          if (isNaN(age)) {
            wx.showToast({
              title: '请输入有效的数字',
              icon: 'none'
            })
            return
          }

          if (age < 1 || age > 120) {
            wx.showToast({
              title: '年龄必须在1-120之间',
              icon: 'none'
            })
            return
          }

          // 更新年龄
          await this.updateUserAge(age)
        }
      }
    })
  },

  // 更新用户昵称
  async updateUserNickname(nickName) {
    wx.showLoading({ title: '更新中...', mask: true })

    try {
      const auth = require('../../utils/auth.js')
      const openid = auth.getOpenid()
      
      if (!openid) {
        throw new Error('未获取到用户信息')
      }

      const db = wx.cloud.database()
      const users = db.collection('users')

      // 查询用户
      const queryRes = await users.where({ _openid: openid }).get()
      
      if (queryRes.data && queryRes.data.length > 0) {
        const docId = queryRes.data[0]._id
        // 更新昵称
        await users.doc(docId).update({
          data: {
            nickName: nickName,
            updatedAt: new Date()
          }
        })

        // 更新本地数据
        const updatedUserInfo = {
          ...this.data.userInfo,
          nickName: nickName
        }

        auth.setLoginState(openid, updatedUserInfo)

        this.setData({
          userInfo: updatedUserInfo
        })

        // 更新全局数据
        const app = getApp()
        app.globalData.userInfo = updatedUserInfo

        wx.hideLoading()
        wx.showToast({
          title: '昵称更新成功',
          icon: 'success'
        })
      } else {
        throw new Error('用户不存在')
      }
    } catch (err) {
      console.error('更新昵称失败', err)
      wx.hideLoading()
      wx.showToast({
        title: err.message || '更新失败，请稍后重试',
        icon: 'none'
      })
    }
  },

  // 更新用户年龄
  async updateUserAge(age) {
    wx.showLoading({ title: '更新中...', mask: true })

    try {
      const auth = require('../../utils/auth.js')
      const openid = auth.getOpenid()
      
      if (!openid) {
        throw new Error('未获取到用户信息')
      }

      const db = wx.cloud.database()
      const users = db.collection('users')

      // 查询用户
      const queryRes = await users.where({ _openid: openid }).get()
      
      if (queryRes.data && queryRes.data.length > 0) {
        const docId = queryRes.data[0]._id
        // 更新年龄
        await users.doc(docId).update({
          data: {
            age: age,
            updatedAt: new Date()
          }
        })

        // 更新本地数据
        const updatedUserInfo = {
          ...this.data.userInfo,
          age: age
        }

        auth.setLoginState(openid, updatedUserInfo)

        this.setData({
          userInfo: updatedUserInfo
        })

        // 更新全局数据
        const app = getApp()
        app.globalData.userInfo = updatedUserInfo

        wx.hideLoading()
        wx.showToast({
          title: '年龄更新成功',
          icon: 'success'
        })
      } else {
        throw new Error('用户不存在')
      }
    } catch (err) {
      console.error('更新年龄失败', err)
      wx.hideLoading()
      wx.showToast({
        title: err.message || '更新失败，请稍后重试',
        icon: 'none'
      })
    }
  }
})

