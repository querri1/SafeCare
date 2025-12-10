// 治愈中心页面
const auth = require('../../utils/auth.js')

// 获取量表显示名称
function getTestDisplayName(type) {
  const nameMap = {
    'PHQ-9': '健康问卷抑郁量表PHQ-9',
    'GAD-7': '广泛性焦虑障碍量表GAD-7',
    'SAS': '焦虑自评量表 SAS'
  }
  return nameMap[type] || type
}

Page({
  data: {
    hasLogin: false, // 登录状态
    // 最近两周测试次数
    twoWeekTestCount: 0,
    // 最近两周最大测试次数
    maxTwoWeekTests: 4,
    // 测试是否完成（最近两周已完成最大次数）
    testCompleted: false,
    // 今日完成状态
    baduanjinCompleted: false, // 健身操是否完成
    musicCompleted: false, // 五音疗法是否完成
    baduanjinProgress: 0, // 健身操完成次数（0/1）
    musicProgress: 0, // 五音疗法完成次数（0/1）
    // 今日轮换的测试项目
    todayTest1: 'PHQ-9', // PHQ-9和GAD-7轮换显示
    todayTest2: 'SAS', // SAS固定显示
    // 今日测试项目的显示名称
    todayTest1Name: '健康问卷抑郁量表PHQ-9',
    todayTest2Name: '焦虑自评量表 SAS',
    // 是否显示PHQ-9/GAD-7（只有超过14天才显示）
    showPHQ9GAD7: false,
    // 今日健身操类型（从四个趣味健身操中随机选择）
    todayExerciseType: 'xiaqi', // 消气操、自在肩颈操、本草纲目、暴汗燃脂操
    todayExerciseName: '消气操',
    // 情绪日记提示语（每天随机显示）
    diaryHint: '' // 情绪日记的温馨提示语
  },

  onLoad() {
    try {
      this.initDiaryHint()
      this.initTodayExercise()
      this.checkLoginAndLoadData()
      // 检查是否应该显示PHQ-9/GAD-7并初始化测试项目
      this.checkAndInitDailyTests()
      // 检查是否需要显示两周提醒
      this.checkTwoWeekReminder()
    } catch (err) {
      console.error('页面加载错误:', err)
      wx.showToast({
        title: '页面加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  onShow() {
    // 页面显示时检查登录状态并重新加载数据
    try {
      this.checkLoginAndLoadData()
      // 重新检查是否应该显示PHQ-9/GAD-7（用户可能刚完成测试）
      this.checkAndInitDailyTests()
      // 检查是否需要显示两周提醒
      this.checkTwoWeekReminder()
    } catch (err) {
      console.error('页面显示错误:', err)
    }
  },

  // 检查是否应该显示PHQ-9/GAD-7并初始化测试项目
  checkAndInitDailyTests() {
    if (!auth.isLoggedIn()) {
      // 未登录时，不显示测试
      this.setData({
        showPHQ9GAD7: false,
        todayTest1: '',
        todayTest1Name: ''
      })
      return
    }

    // 获取上次PHQ-9或GAD-7测试时间
    this.getLastTestTime().then(lastTestTime => {
      let shouldShow = false
      
      if (!lastTestTime) {
        // 从未测试过，显示PHQ-9/GAD-7
        shouldShow = true
      } else {
        // 计算距离上次测试的天数
        const daysSinceLastTest = Math.floor((new Date() - lastTestTime) / (1000 * 60 * 60 * 24))
        // 如果超过14天，显示PHQ-9/GAD-7
        shouldShow = daysSinceLastTest >= 14
      }

      // 初始化测试项目
      this.initDailyTests(shouldShow)
    }).catch(err => {
      console.error('检查测试时间失败', err)
      // 出错时默认不显示
      this.setData({
        showPHQ9GAD7: false,
        todayTest1: '',
        todayTest1Name: ''
      })
    })
  },

  // 初始化每日轮换的测试项目
  initDailyTests(shouldShowPHQ9GAD7 = false) {
    // 获取今天的日期（年月日）
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    
    // SAS固定显示
    const test2 = 'SAS'
    
    if (shouldShowPHQ9GAD7) {
      // PHQ-9和GAD-7轮换显示
      const tests = ['PHQ-9', 'GAD-7']
      const test1 = tests[dayOfYear % 2] // 每天轮换
      
      this.setData({
        showPHQ9GAD7: true,
        todayTest1: test1,
        todayTest2: test2,
        todayTest1Name: getTestDisplayName(test1),
        todayTest2Name: getTestDisplayName(test2)
      })
    } else {
      // 不显示PHQ-9/GAD-7
      this.setData({
        showPHQ9GAD7: false,
        todayTest1: '',
        todayTest1Name: '',
        todayTest2: test2,
        todayTest2Name: getTestDisplayName(test2)
      })
    }
  },

  // 初始化今日健身操（从四个趣味健身操中随机选择）
  initTodayExercise() {
    const exercises = [
      { type: 'xiaqi', name: '消气操' },
      { type: 'shoulder', name: '自在肩颈操' },
      { type: 'herbal', name: '本草纲目' },
      { type: 'sweat', name: '暴汗燃脂操' }
    ]
    
    // 根据日期计算随机索引，确保每天显示相同的健身操
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    const exerciseIndex = dayOfYear % exercises.length
    
    const selectedExercise = exercises[exerciseIndex]
    this.setData({
      todayExerciseType: selectedExercise.type,
      todayExerciseName: selectedExercise.name
    })
  },

  // 初始化情绪日记提示语（每天随机显示）
  initDiaryHint() {
    // 情绪日记提示语列表
    const hints = [
      '今天有什么微小的瞬间，让你的心轻轻动了一下呢？',
      '此刻的你，如果是一种天气，会是什么呢？',
      '给今天的自己泡杯茶的时间吧，你想对此刻的心情说点什么呢？',
      '我就在这里，安静地听你说说你的今天。',
      '如果用三个词捕捉今天的情绪拼图，你愿意选择哪三个词呢？',
      '你今天的情绪曲线里，藏着什么故事呀？',
      '你注意到身体哪里在诉说情绪了吗？听，是肩膀？胸口？还是呼吸？',
      '亲爱的你呀，如果今天的情绪有个颜色，它会是什么颜色呢？'
    ]
    
    // 根据日期计算随机索引，确保每天显示相同的提示语
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    const hintIndex = dayOfYear % hints.length
    
    this.setData({
      diaryHint: hints[hintIndex]
    })
  },

  // 检查登录状态并加载数据
  checkLoginAndLoadData() {
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ hasLogin: isLoggedIn })
    
    if (isLoggedIn) {
      this.loadTwoWeekTestCount()
      this.loadTodayCheckinStatus()
    } else {
      // 未登录时重置数据
      this.setData({ 
        twoWeekTestCount: 0,
        testCompleted: false,
        baduanjinCompleted: false,
        musicCompleted: false,
        baduanjinProgress: 0,
        musicProgress: 0
      })
    }
  },

  // 登录成功回调（由个人中心页面调用）
  onLoginSuccess() {
    this.checkLoginAndLoadData()
  },

  // 查询今日打卡状态
  loadTodayCheckinStatus() {
    if (!auth.isLoggedIn()) {
      this.setData({
        baduanjinCompleted: false,
        musicCompleted: false,
        baduanjinProgress: 0,
        musicProgress: 0
      })
      return
    }

    if (!wx.cloud) {
      console.error('云开发未初始化')
      this.setData({
        baduanjinCompleted: false,
        musicCompleted: false,
        baduanjinProgress: 0,
        musicProgress: 0
      })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 查询今日打卡记录
    db.collection('checkin_records')
      .where({
        date: _.gte(today).and(_.lt(tomorrow))
      })
      .get()
      .then(res => {
        let baduanjinCompleted = false
        let musicCompleted = false

        if (res.data && res.data.length > 0) {
          // 检查今日打卡记录中的活动类型
          const todayRecord = res.data[0]
          const activities = todayRecord.activities || []
          
          baduanjinCompleted = activities.includes('baduanjin')
          musicCompleted = activities.includes('music')
        }

        this.setData({
          baduanjinCompleted: baduanjinCompleted,
          musicCompleted: musicCompleted,
          baduanjinProgress: baduanjinCompleted ? 1 : 0,
          musicProgress: musicCompleted ? 1 : 0
        })
      })
      .catch(err => {
        console.error('查询今日打卡状态失败', err)
        // 查询失败时设置为未完成
        this.setData({
          baduanjinCompleted: false,
          musicCompleted: false,
          baduanjinProgress: 0,
          musicProgress: 0
        })
      })
  },

  // 查询最近两周测试次数
  loadTwoWeekTestCount() {
    if (!auth.isLoggedIn()) {
      this.setData({ twoWeekTestCount: 0 })
      return
    }
    
    if (!wx.cloud) {
      console.error('云开发未初始化')
      this.setData({
        twoWeekTestCount: 0
      })
      return
    }

    // 计算两周前的开始时间（14天前 00:00:00）
    const now = new Date()
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(now.getDate() - 14)
    twoWeeksAgo.setHours(0, 0, 0, 0)

    const db = wx.cloud.database()
    const _ = db.command
    
    db.collection('screening_records')
      .where({
        createdAt: _.gte(twoWeeksAgo)
      })
      .count()
      .then(res => {
        const twoWeekTestCount = res.total
        const testCompleted = twoWeekTestCount >= this.data.maxTwoWeekTests
        this.setData({
          twoWeekTestCount: twoWeekTestCount,
          testCompleted: testCompleted
        })
      })
      .catch(err => {
        console.error('查询最近两周测试次数失败', err)
        // 查询失败时设置为0，避免显示错误
        this.setData({
          twoWeekTestCount: 0
        })
      })
  },

  // 开始练习（显示选择弹窗）
  startExercise() {
    // 第一级选择：标准八段锦 或 趣味健身操
    wx.showActionSheet({
      itemList: ['标准八段锦', '趣味健身操'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 选择标准八段锦，直接跳转
          wx.navigateTo({
            url: '/pages/baduanjin/baduanjin?type=standard'
          })
        } else if (res.tapIndex === 1) {
          // 选择趣味健身操，显示第二级选择
          this.showFunExerciseSelection()
        }
      },
      fail: (err) => {
        console.log('用户取消选择', err)
      }
    })
  },

  // 开始今日推荐的健身操（直接跳转到今日随机选择的健身操）
  startTodayExercise() {
    wx.navigateTo({
      url: `/pages/baduanjin/baduanjin?type=${this.data.todayExerciseType}`
    })
  },

  // 显示趣味健身操分类选择（第二级）
  showFunExerciseSelection() {
    wx.showActionSheet({
      itemList: ['消气操', '自在肩颈操', '本草纲目', '暴汗燃脂操'],
      success: (res) => {
        let type = ''
        if (res.tapIndex === 0) {
          // 选择消气操
          type = 'xiaqi'
        } else if (res.tapIndex === 1) {
          // 选择自在肩颈操
          type = 'shoulder'
        } else if (res.tapIndex === 2) {
          // 选择本草纲目
          type = 'herbal'
        } else if (res.tapIndex === 3) {
          // 选择暴汗燃脂操
          type = 'sweat'
        }
        
        if (type) {
          wx.navigateTo({
            url: `/pages/baduanjin/baduanjin?type=${type}`
          })
        }
      },
      fail: (err) => {
        console.log('用户取消选择', err)
      }
    })
  },

  // 开始音乐疗法
  startMusicTherapy() {
    wx.navigateTo({
      url: '/pages/music-therapy/music-therapy'
    })
  },

  // 开始测试（检查次数限制并显示选择弹窗）
  startTest() {
    // 检查是否已达到最近两周最大测试次数
    if (this.data.twoWeekTestCount >= this.data.maxTwoWeekTests) {
      // 已完成最近两周测试，询问是否继续
      wx.showModal({
        title: '提示',
        content: `最近两周已完成 ${this.data.maxTwoWeekTests} 次测试。是否要继续进行额外测试？`,
        confirmText: '继续测试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户选择继续测试，显示选择弹窗
            this.showTestSelection()
          }
        }
      })
      return
    }

    // 未完成最近两周测试，直接显示选择弹窗
    this.showTestSelection()
  },

  // 显示测试选择弹窗
  showTestSelection() {
    wx.showActionSheet({
      itemList: ['健康问卷抑郁量表PHQ-9', '广泛性焦虑障碍量表GAD-7', '焦虑自评量表 SAS'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 选择PHQ-9
          this.startPHQ9Test()
        } else if (res.tapIndex === 1) {
          // 选择GAD-7
          this.startGAD7Test()
        } else if (res.tapIndex === 2) {
          // 选择SAS
          this.startSASTest()
        }
      },
      fail: (err) => {
        console.log('用户取消选择', err)
      }
    })
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
    wx.navigateTo({
      url: '/pages/phq9/phq9'
    })
  },

  // 开始GAD-7测试
  startGAD7Test() {
    wx.navigateTo({
      url: '/pages/gad7/gad7'
    })
  },

  // 开始SAS测试
  startSASTest() {
    wx.navigateTo({
      url: '/pages/sas/sas'
    })
  },

  // 开始今日第一个测试
  startTodayTest1() {
    if (this.data.todayTest1 === 'PHQ-9') {
      this.startPHQ9Test()
    } else if (this.data.todayTest1 === 'GAD-7') {
      this.startGAD7Test()
    } else if (this.data.todayTest1 === 'SAS') {
      this.startSASTest()
    }
  },

  // 开始今日第二个测试
  startTodayTest2() {
    if (this.data.todayTest2 === 'PHQ-9') {
      this.startPHQ9Test()
    } else if (this.data.todayTest2 === 'GAD-7') {
      this.startGAD7Test()
    } else if (this.data.todayTest2 === 'SAS') {
      this.startSASTest()
    }
  },

  // 打开情绪日记
  openEmotionDiary() {
    wx.navigateTo({
      url: '/pages/emotion-diary/emotion-diary'
    })
  },

  // 检查是否需要显示两周提醒
  checkTwoWeekReminder() {
    if (!auth.isLoggedIn()) {
      return
    }

    // 检查是否已经显示过提醒（今天）
    const today = new Date().toDateString()
    const lastReminderDate = wx.getStorageSync('lastReminderDate')
    if (lastReminderDate === today) {
      return // 今天已经显示过提醒
    }

    // 获取上次PHQ-9或GAD-7测试时间
    this.getLastTestTime().then(lastTestTime => {
      if (!lastTestTime) {
        // 从未测试过，不显示提醒
        return
      }

      // 计算距离上次测试的天数
      const daysSinceLastTest = Math.floor((new Date() - lastTestTime) / (1000 * 60 * 60 * 24))
      
      // 如果超过14天，显示提醒
      if (daysSinceLastTest >= 14) {
        this.showTwoWeekReminder()
      }
    }).catch(err => {
      console.error('检查两周提醒失败', err)
    })
  },

  // 获取上次PHQ-9或GAD-7测试时间
  getLastTestTime() {
    return new Promise((resolve, reject) => {
      if (!wx.cloud) {
        resolve(null)
        return
      }

      const db = wx.cloud.database()
      const _ = db.command

      // 查询最近的PHQ-9或GAD-7测试记录
      db.collection('screening_records')
        .where(_.or([
          { type: 'PHQ-9' },
          { type: 'GAD-7' }
        ]))
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
        .then(res => {
          if (res.data && res.data.length > 0) {
            resolve(new Date(res.data[0].createdAt))
          } else {
            resolve(null)
          }
        })
        .catch(err => {
          console.error('查询上次测试时间失败', err)
          resolve(null)
        })
    })
  },

  // 显示两周提醒
  showTwoWeekReminder() {
    // 三种提醒话术
    const reminders = [
      {
        title: '💚 两周小提醒',
        content: '亲爱的，又过去两周了。\n想邀请你花3分钟，温柔地回顾一下近期的情绪起伏。\n这份小检查（PHQ-9/GAD-7）就像一份"心灵体温计"，能帮你把模糊的感受变得更清晰。\n结果只为帮你更懂自己，而非定义你。\n现在开始吗？\n\n─────────────\n此工具用于自我觉察，不能替代专业医疗诊断。'
      },
      {
        title: '💚 定期关怀',
        content: '定期关心身体时，也别忘了聆听内心的声音哦。\n我们准备了一份专业的情绪小扫描（PHQ-9/GAD-7），帮你温柔梳理过去两周的感受，帮助你看见自己的状态，并给予温暖的行动思路。\n你正在主动管理健康，这是一件非常了不起的事呢！\n\n─────────────\n此工具用于自我觉察，不能替代专业医疗诊断。'
      },
      {
        title: '💚 两周关怀',
        content: '亲爱的朋友，最近两周过得好吗？\n花几分钟，用PHQ-9/GAD-7量表温柔回顾前两周的自己吧！\n了解自己，是关怀自己的第一步哦。亲爱的你，所有的感受都值得被尊重。\n\n─────────────\n此工具用于自我觉察，不能替代专业医疗诊断。'
      }
    ]

    // 随机选择一条提醒话术
    const randomIndex = Math.floor(Math.random() * reminders.length)
    const reminder = reminders[randomIndex]

    // 记录今天已显示提醒
    wx.setStorageSync('lastReminderDate', new Date().toDateString())

    // 显示提醒弹窗
    wx.showModal({
      title: reminder.title,
      content: reminder.content,
      confirmText: '👉 现在开始了解自己',
      cancelText: '👉下次再提醒我',
      confirmColor: '#34D399',
      success: (res) => {
        if (res.confirm) {
          // 跳转到心理健康自测
          this.startTest()
        }
        // 如果选择"下次再提醒我"，不做任何操作，下次进入页面时还会提醒
      }
    })
  }
})

