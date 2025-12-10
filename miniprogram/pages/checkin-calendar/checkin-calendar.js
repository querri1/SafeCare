// 打卡日历页面
const auth = require('../../utils/auth.js')

Page({
  data: {
    hasLogin: false,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarData: [], // 日历数据
    checkinRecords: [] // 打卡记录
  },

  onLoad() {
    this.checkLoginAndLoadData()
  },

  onShow() {
    this.checkLoginAndLoadData()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoadData() {
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ hasLogin: isLoggedIn })
    
    if (isLoggedIn) {
      this.loadCalendarData()
    } else {
      this.resetData()
    }
  },

  // 重置数据
  resetData() {
    this.setData({
      calendarData: [],
      checkinRecords: []
    })
  },

  // 加载日历数据
  loadCalendarData() {
    if (!wx.cloud) {
      this.generateCalendar()
      return
    }

    const { currentYear, currentMonth } = this.data
    const monthStart = new Date(currentYear, currentMonth - 1, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(currentYear, currentMonth, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const db = wx.cloud.database()
    const _ = db.command

    // 查询本月打卡记录
    db.collection('checkin_records')
      .where({
        date: _.gte(monthStart).and(_.lte(monthEnd))
      })
      .get()
      .then(res => {
        const records = res.data || []
        const checkinDates = new Set()
        
        records.forEach(record => {
          const date = new Date(record.date)
          const day = date.getDate()
          checkinDates.add(day)
        })

        this.setData({ checkinRecords: Array.from(checkinDates) })
        this.generateCalendar()
      })
      .catch(err => {
        console.error('查询打卡记录失败', err)
        this.generateCalendar()
      })
  },

  // 生成日历
  generateCalendar() {
    const { currentYear, currentMonth, checkinRecords } = this.data
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const firstDayWeek = firstDay.getDay() // 0=周日, 1=周一, ...
    const daysInMonth = lastDay.getDate()

    const calendar = []
    
    // 填充上个月的空白
    for (let i = 0; i < firstDayWeek; i++) {
      calendar.push({ day: null, isCurrentMonth: false })
    }

    // 填充当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push({
        day: day,
        isCurrentMonth: true,
        hasCheckin: checkinRecords.includes(day)
      })
    }

    // 填充下个月的空白（使日历完整）
    const remaining = 42 - calendar.length // 6行 x 7天 = 42
    for (let i = 0; i < remaining; i++) {
      calendar.push({ day: null, isCurrentMonth: false })
    }

    this.setData({ calendarData: calendar })
  },

  // 上一个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    this.setData({ currentYear, currentMonth })
    this.loadCalendarData()
  },

  // 下一个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    this.setData({ currentYear, currentMonth })
    this.loadCalendarData()
  },

  // 点击日期
  onDayTap(e) {
    const day = e.currentTarget.dataset.day
    const isCurrentMonth = e.currentTarget.dataset.isCurrentMonth
    const hasCheckin = e.currentTarget.dataset.hasCheckin

    // 只有当前月份的日期才能点击
    if (!isCurrentMonth || !day) {
      return
    }

    // 构建日期
    const { currentYear, currentMonth } = this.data
    const date = new Date(currentYear, currentMonth - 1, day)
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // 即使没有打卡记录，也可以查看该日期（可能只有情绪或日记）
    // 加载该日期的情绪和日记
    this.loadDayDetail(dateStr, date)
  },

  // 加载日期详情（情绪和日记）
  loadDayDetail(dateStr, date) {
    if (!wx.cloud) {
      // 即使没有云开发，也显示空详情
      this.showDayDetail(dateStr, [], null)
      return
    }

    const db = wx.cloud.database()
    // 确保使用正确的日期对象（优先使用传入的date参数）
    let dateObj
    if (date instanceof Date) {
      dateObj = new Date(date)
    } else {
      // 从字符串解析日期
      const dateParts = dateStr.split('-')
      if (dateParts.length === 3) {
        dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
      } else {
        dateObj = new Date(dateStr)
      }
    }
    dateObj.setHours(0, 0, 0, 0)
    const tomorrow = new Date(dateObj)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 并行查询情绪记录和日记
    Promise.all([
      db.collection('emotion_records')
        .where({
          date: db.command.gte(dateObj).and(db.command.lt(tomorrow))
        })
        .get()
        .catch(err => {
          // 如果集合不存在，返回空数组
          if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
            return { data: [] }
          }
          console.warn('查询情绪记录失败', err)
          return { data: [] }
        }),
      db.collection('emotion_diary')
        .where({
          date: db.command.gte(dateObj).and(db.command.lt(tomorrow))
        })
        .get()
        .catch(err => {
          // 如果集合不存在，返回空数组
          if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
            return { data: [] }
          }
          console.warn('查询日记失败', err)
          return { data: [] }
        })
    ]).then(([emotionRes, diaryRes]) => {
      const emotions = emotionRes.data || []
      const diaries = diaryRes.data || []
      const diary = diaries.length > 0 ? diaries[0] : null

      // 显示详情
      this.showDayDetail(dateStr, emotions, diary)
    }).catch(err => {
      console.error('加载日期详情失败', err)
      // 即使出错也显示详情（可能为空）
      this.showDayDetail(dateStr, [], null)
    })
  },

  // 显示日期详情
  showDayDetail(dateStr, emotions, diary) {
    const emotionUtil = require('../../utils/emotion.js')
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dateText = `${year}年${month}月${day}日`

    let content = `📅 ${dateText}\n\n`

    // 显示情绪
    if (emotions.length > 0) {
      content += '💭 记录的心情：\n'
      emotions.forEach(emotion => {
        const display = emotionUtil.getEmotionDisplay(emotion.emotion, emotion.level)
        const activityName = emotion.activityType === 'baduanjin' ? '健身操' : '五音疗法'
        content += `${display}（${activityName}）\n`
      })
      content += '\n'
    } else {
      content += '💭 未记录心情\n\n'
    }

    // 显示日记
    if (diary && diary.content) {
      const diaryContent = diary.content.length > 100 ? diary.content.substring(0, 100) + '...' : diary.content
      content += `📝 日记：\n${diaryContent}`
    } else {
      content += '📝 未写日记'
    }

    wx.showModal({
      title: '当日记录',
      content: content,
      showCancel: true,
      cancelText: '关闭',
      confirmText: diary ? '查看日记' : '写日记',
      confirmColor: '#34D399',
      success: (res) => {
        if (res.confirm) {
          // 跳转到情绪日记页面
          wx.navigateTo({
            url: `/pages/emotion-diary/emotion-diary?date=${dateStr}`
          })
        }
      }
    })
  },

  // 前往登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  }
})

