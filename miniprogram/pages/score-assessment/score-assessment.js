// 评分评估页面
const auth = require('../../utils/auth.js')
const diaryScores = require('../../utils/diaryScores.js')

Page({
  data: {
    currentDate: '',
    currentDateStr: '', // 当前日期字符串（YYYY-MM-DD格式）
    blockType: 'core', // 'core' 或 'deep'
    blockName: '', // 板块名称
    dimensions: [], // 当前板块的维度列表
    scores: {}, // 评分数据 {key: score}
    total: 0, // 总分
    dailyReminder: '' // 每日提醒词
  },

  onLoad(options) {
    // 获取参数
    const blockType = options.blockType || 'core' // 'core' 或 'deep'
    const dateStr = options.date || ''
    
    // 获取日期
    let dateObj
    if (dateStr) {
      const dateParts = dateStr.split('-')
      if (dateParts.length === 3) {
        dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
      } else {
        dateObj = new Date(dateStr)
      }
    } else {
      dateObj = new Date()
    }
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const dateStrFormatted = `${year}-${month}-${day}`
    
    // 设置板块信息
    const blockInfo = blockType === 'core' 
      ? { name: '每日核心追踪', dimensions: diaryScores.CORE_TRACKING }
      : { name: '自我深度探索', dimensions: diaryScores.DEEP_EXPLORATION }
    
    // 初始化每日提醒词
    const dailyReminder = diaryScores.getDailyReminder()
    
    // 初始化空评分
    const emptyScores = {}
    blockInfo.dimensions.forEach(dim => {
      emptyScores[dim.key] = null
    })
    
    this.setData({
      currentDate: `${year}年${month}月${day}日`,
      currentDateStr: dateStrFormatted,
      blockType: blockType,
      blockName: blockInfo.name,
      dimensions: blockInfo.dimensions,
      dailyReminder: dailyReminder,
      scores: emptyScores
    })
    
    // 加载已有评分
    this.loadScores(dateStrFormatted, blockType)
  },

  // 加载已有评分
  loadScores(dateStr, blockType) {
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
          
          // 只加载当前板块的评分
          const blockScores = {}
          this.data.dimensions.forEach(dim => {
            blockScores[dim.key] = scores[dim.key] !== undefined ? scores[dim.key] : null
          })
          
          const total = diaryScores.calculateTotalScore(blockScores, this.data.dimensions)
          
          this.setData({
            scores: blockScores,
            total: total
          })
        }
      })
      .catch(err => {
        console.error('加载评分失败', err)
      })
  },

  // 选择评分
  selectScore(e) {
    const key = e.currentTarget.dataset.key
    const score = parseInt(e.currentTarget.dataset.score)
    
    if (isNaN(score) || score < 0 || score > 5) {
      return
    }
    
    const scores = { ...this.data.scores }
    scores[key] = score
    
    // 计算总分
    const total = diaryScores.calculateTotalScore(scores, this.data.dimensions)
    
    this.setData({
      scores: scores,
      total: total
    })
  },

  // 保存评分
  saveScores() {
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

    // 检查是否所有维度都已评分
    const allScored = this.data.dimensions.every(dim => {
      const score = this.data.scores[dim.key]
      return score !== null && score !== undefined && score >= 0 && score <= 5
    })

    if (!allScored) {
      wx.showToast({
        title: '请完成所有评分',
        icon: 'none',
        duration: 2000
      })
      return
    }

    const db = wx.cloud.database()
    const date = new Date(this.data.currentDateStr)
    date.setHours(0, 0, 0, 0)

    wx.showLoading({ title: '保存中...', mask: true })

    // 先查询是否已有日记记录
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)

    db.collection('emotion_diary')
      .where({
        date: db.command.gte(date).and(db.command.lt(tomorrow))
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          // 更新现有记录
          const diary = res.data[0]
          const existingScores = diary.scores || {}
          const updatedScores = { ...existingScores, ...this.data.scores }
          
          // 计算总分
          const coreTotal = diaryScores.calculateTotalScore(updatedScores, diaryScores.CORE_TRACKING)
          const deepTotal = diaryScores.calculateTotalScore(updatedScores, diaryScores.DEEP_EXPLORATION)
          
          return db.collection('emotion_diary')
            .doc(diary._id)
            .update({
              data: {
                scores: updatedScores,
                coreTotal: coreTotal,
                deepTotal: deepTotal,
                updatedAt: new Date()
              }
            })
        } else {
          // 创建新记录（只保存评分，不保存日记内容）
          const allScores = {}
          // 初始化所有维度
          diaryScores.CORE_TRACKING.forEach(dim => {
            allScores[dim.key] = null
          })
          diaryScores.DEEP_EXPLORATION.forEach(dim => {
            allScores[dim.key] = null
          })
          // 更新当前板块的评分
          Object.assign(allScores, this.data.scores)
          
          const coreTotal = diaryScores.calculateTotalScore(allScores, diaryScores.CORE_TRACKING)
          const deepTotal = diaryScores.calculateTotalScore(allScores, diaryScores.DEEP_EXPLORATION)
          
          return db.collection('emotion_diary')
            .add({
              data: {
                content: '', // 空内容
                scores: allScores,
                coreTotal: coreTotal,
                deepTotal: deepTotal,
                date: date,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
        }
      })
      .then(() => {
        wx.hideLoading()
        // 检查是否有低分
        this.checkLowScore()
      })
      .catch(err => {
        console.error('保存评分失败', err)
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
  },

  // 检查低分并显示关怀性追问
  checkLowScore() {
    const isLowScore = diaryScores.checkSingleBlockLowScore(this.data.scores, this.data.dimensions, this.data.blockType)
    
    if (isLowScore) {
      // 显示低分关怀性追问
      const prompt = diaryScores.getLowScorePrompt(this.data.blockType)
      
      wx.showModal({
        title: '💭',
        content: prompt,
        showCancel: true,
        cancelText: '稍后',
        confirmText: '去写日记',
        confirmColor: '#34D399',
        success: (res) => {
          if (res.confirm) {
            // 跳转到情绪日记页面（此时日记还未保存，可以写心里话）
            wx.navigateTo({
              url: `/pages/emotion-diary/emotion-diary?date=${this.data.currentDateStr}`
            })
          } else {
            // 用户选择稍后，返回上一页
            wx.navigateBack()
          }
        }
      })
    } else {
      // 分数正常，直接返回
      wx.showToast({
        title: '评分已保存',
        icon: 'success',
        duration: 1500
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  }
})

