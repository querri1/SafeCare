// 情绪日记页面
const auth = require('../../utils/auth.js')
const diaryScores = require('../../utils/diaryScores.js')

Page({
  data: {
    currentDate: '',
    currentDateStr: '', // 当前日期字符串（YYYY-MM-DD格式）
    diaryContent: '',
    diaryId: null, // 如果已存在日记，保存ID用于更新
    // 评分相关（仅用于显示总分）
    dailyReminder: '', // 每日提醒词
    coreTotal: 0, // 每日核心追踪总分
    deepTotal: 0 // 自我深度探索总分
  },

  onLoad(options) {
    // 获取日期参数（如果有）
    let dateObj
    if (options.date) {
      // 如果传入了日期字符串（格式：YYYY-MM-DD）
      const dateParts = options.date.split('-')
      if (dateParts.length === 3) {
        dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
      } else {
        dateObj = new Date(options.date)
      }
    } else {
      dateObj = new Date()
    }
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // 初始化每日提醒词
    const dailyReminder = diaryScores.getDailyReminder()
    
    this.setData({
      currentDate: `${year}年${month}月${day}日`,
      currentDateStr: dateStr,
      dailyReminder: dailyReminder
    })

    // 加载当天的日记
    this.loadDiary(dateStr)
  },

  // 加载日记
  loadDiary(dateStr) {
    if (!auth.isLoggedIn() || !wx.cloud) {
      return
    }

    const db = wx.cloud.database()
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)

    db.collection('emotion_diary')
      .where({
        date: db.command.gte(date).and(db.command.lt(tomorrow))
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const diary = res.data[0]
          const scores = diary.scores || {}
          const coreTotal = diaryScores.calculateTotalScore(scores, diaryScores.CORE_TRACKING)
          const deepTotal = diaryScores.calculateTotalScore(scores, diaryScores.DEEP_EXPLORATION)
          
          this.setData({
            diaryContent: diary.content || '',
            diaryId: diary._id,
            coreTotal: coreTotal,
            deepTotal: deepTotal
          })
        } else {
          // 没有日记记录，总分显示为0
          this.setData({
            coreTotal: 0,
            deepTotal: 0
          })
        }
      })
      .catch(err => {
        console.error('加载日记失败', err)
      })
  },

  // 输入日记内容
  onDiaryInput(e) {
    this.setData({
      diaryContent: e.detail.value
    })
  },

  // 跳转到评分评估页面
  goToScoreAssessment(e) {
    const blockType = e.currentTarget.dataset.blockType || 'core'
    wx.navigateTo({
      url: `/pages/score-assessment/score-assessment?blockType=${blockType}&date=${this.data.currentDateStr}`
    })
  },

  // 页面显示时刷新评分数据
  onShow() {
    if (this.data.currentDateStr) {
      this.loadDiary(this.data.currentDateStr)
    }
  },

  // 保存日记
  saveDiary() {
    if (!auth.isLoggedIn()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (!wx.cloud) {
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      })
      return
    }

    const content = this.data.diaryContent.trim()
    const db = wx.cloud.database()
    
    // 使用传入的日期或今天的日期
    let targetDate
    if (this.data.currentDateStr) {
      const dateParts = this.data.currentDateStr.split('-')
      targetDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    } else {
      targetDate = new Date()
    }
    targetDate.setHours(0, 0, 0, 0)

    wx.showLoading({ title: '保存中...', mask: true })

    if (this.data.diaryId) {
      // 更新现有日记
      db.collection('emotion_diary')
        .doc(this.data.diaryId)
        .update({
          data: {
            content: content,
            updatedAt: new Date()
          }
        })
        .then(() => {
          wx.hideLoading()
          this.showSaveSuccessTip()
        })
        .catch(err => {
          console.error('更新日记失败', err)
          wx.hideLoading()
          if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
            wx.showModal({
              title: '集合不存在',
              content: '请在云开发控制台创建 emotion_diary 集合\n\n操作步骤：\n1. 打开云开发控制台\n2. 进入"数据库"\n3. 点击"+"创建新集合\n4. 集合名称：emotion_diary\n5. 权限设置为"仅创建者可读写"',
              showCancel: false,
              confirmText: '我知道了'
            })
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
    } else {
      // 创建新日记
      db.collection('emotion_diary')
        .add({
          data: {
            content: content,
            date: targetDate,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        .then(res => {
          this.setData({ diaryId: res._id })
          wx.hideLoading()
          this.showSaveSuccessTip()
        })
        .catch(err => {
          console.error('保存日记失败', err)
          wx.hideLoading()
          if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
            wx.showModal({
              title: '集合不存在',
              content: '请在云开发控制台创建 emotion_diary 集合\n\n操作步骤：\n1. 打开云开发控制台\n2. 进入"数据库"\n3. 点击"+"创建新集合\n4. 集合名称：emotion_diary\n5. 权限设置为"仅创建者可读写"',
              showCancel: false,
              confirmText: '我知道了'
            })
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
    }
  },

  // 显示保存成功提示
  showSaveSuccessTip() {
    const { currentDateStr } = this.data
    const dateParts = currentDateStr.split('-')
    const dateText = dateParts.length === 3 
      ? `${parseInt(dateParts[0])}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`
      : '今天'

    wx.showModal({
      title: '✨ 保存成功',
      content: `你的日记已保存！\n\n你可以在以下位置查看日记和情绪记录：\n\n📊 数据中心\n   → 切换到"月"视图\n   → 点击${dateText}查看详情\n\n📅 打卡日历\n   → 点击已打卡的日期查看\n\n想要现在去查看吗？`,
      showCancel: true,
      cancelText: '稍后',
      confirmText: '去查看',
      confirmColor: '#34D399',
      success: (res) => {
        if (res.confirm) {
          // 跳转到数据中心
          wx.switchTab({
            url: '/pages/data-center/data-center',
            success: () => {
              // 切换到月视图
              setTimeout(() => {
                const pages = getCurrentPages()
                const dataCenterPage = pages[pages.length - 1]
                if (dataCenterPage && typeof dataCenterPage.setData === 'function') {
                  dataCenterPage.setData({ currentPeriod: 'month' })
                  // 提示用户点击日期
                  setTimeout(() => {
                    wx.showToast({
                      title: '请点击日期查看详情',
                      icon: 'none',
                      duration: 2000
                    })
                  }, 300)
                }
              }, 500)
            }
          })
        }
      }
    })
  },

  // 转发给朋友
  onShareAppMessage(options) {
    return {
      title: '记录情绪日记，关注心理健康 - 安心宝',
      path: `/pages/emotion-diary/emotion-diary?date=${this.data.currentDateStr}`,
      imageUrl: '' // 可选：分享图片
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '记录情绪日记，与自己对话 - 安心宝心理健康管理',
      query: `date=${this.data.currentDateStr}`,
      imageUrl: '' // 可选：分享图片
    }
  }
})

