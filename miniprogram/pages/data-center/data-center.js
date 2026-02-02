// 数据中心页面
const auth = require('../../utils/auth.js')

Page({
  data: {
    currentPeriod: 'week', // 'week' 或 'month'
    hasLogin: false, // 登录状态
    // 数据概览
    consecutiveDays: 0, // 连续打卡天数
    weekCompleted: 0, // 本周完成次数
    monthAchievements: 0, // 本月成就
    // 周视图数据
    weekData: [], // 最近7天的打卡数据
    hasEmotionData: false, // 是否有情绪数据
    // 月视图数据
    monthData: [], // 当前月的打卡数据
    currentMonth: '', // 当前月份显示
    // 测试记录
    testRecords: [], // 最近的测试记录
    // 评分趋势数据
    scoreWeekData: [] // 最近7天的评分数据 [{date, label, coreTotal, deepTotal, coreHeight, deepHeight}, ...]
  },

  onLoad() {
    this.checkLoginAndLoadData()
  },

  onShow() {
    // 页面显示时检查登录状态并重新加载数据
    this.checkLoginAndLoadData()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoadData() {
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ hasLogin: isLoggedIn })
    
    if (isLoggedIn) {
      this.loadAllData()
    } else {
      // 未登录时重置所有数据
      this.resetData()
    }
  },

  // 重置数据（退出登录时调用）
  resetData() {
    this.setData({
      consecutiveDays: 0,
      weekCompleted: 0,
      monthAchievements: 0,
      weekData: [],
      monthData: [],
      currentMonth: '',
      testRecords: [],
      scoreWeekData: []
    })
  },

  // 登录成功回调（由个人中心页面调用）
  onLoginSuccess() {
    this.checkLoginAndLoadData()
  },

  // 加载所有数据
  loadAllData() {
    this.loadConsecutiveDays()
    this.loadWeekCompleted()
    this.loadMonthAchievements()
    this.loadWeekData()
    this.loadMonthData()
    this.loadTestRecords()
    this.loadScoreWeekData()
  },

  // 计算连续打卡天数
  loadConsecutiveDays() {
    if (!auth.isLoggedIn()) {
      this.setData({ consecutiveDays: 0 })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ consecutiveDays: 0 })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 查询所有打卡记录，按日期降序排列
    db.collection('checkin_records')
      .orderBy('date', 'desc')
      .get()
      .then(res => {
        if (!res.data || res.data.length === 0) {
          this.setData({ consecutiveDays: 0 })
          return
        }

        // 计算连续打卡天数
        // 从今天开始往前推，检查是否连续
        let consecutive = 0
        let checkDate = new Date(today)
        
        // 先检查今天是否有打卡
        const todayRecord = res.data.find(record => {
          const recordDate = new Date(record.date)
          recordDate.setHours(0, 0, 0, 0)
          return recordDate.getTime() === checkDate.getTime()
        })
        
        if (!todayRecord) {
          // 今天没有打卡，连续天数为0
          this.setData({ consecutiveDays: 0 })
          return
        }
        
        // 今天有打卡，开始计算连续天数
        consecutive = 1
        checkDate.setDate(checkDate.getDate() - 1)
        
        // 继续往前检查
        for (let i = 0; i < res.data.length; i++) {
          const record = res.data[i]
          const recordDate = new Date(record.date)
          recordDate.setHours(0, 0, 0, 0)
          
          // 如果找到期望的日期，继续往前推
          if (recordDate.getTime() === checkDate.getTime()) {
            consecutive++
            checkDate.setDate(checkDate.getDate() - 1)
          } else if (recordDate.getTime() < checkDate.getTime()) {
            // 如果记录日期早于期望日期，说明中间有断档，停止计算
            break
          }
          // 如果记录日期晚于期望日期，继续查找下一条记录
        }

        this.setData({ consecutiveDays: consecutive })
      })
      .catch(err => {
        console.error('查询连续打卡天数失败', err)
        this.setData({ consecutiveDays: 0 })
      })
  },

  // 加载本周完成次数
  loadWeekCompleted() {
    if (!auth.isLoggedIn()) {
      this.setData({ weekCompleted: 0 })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ weekCompleted: 0 })
      return
    }

    // 计算本周的开始时间（周一 00:00:00）
    const now = new Date()
    const day = now.getDay()
    const daysToMonday = day === 0 ? 6 : day - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('checkin_records')
      .where({
        date: _.gte(weekStart)
      })
      .count()
      .then(res => {
        this.setData({ weekCompleted: res.total })
      })
      .catch(err => {
        console.error('查询本周完成次数失败', err)
        this.setData({ weekCompleted: 0 })
      })
  },

  // 加载本月成就（本月打卡天数）
  loadMonthAchievements() {
    if (!auth.isLoggedIn()) {
      this.setData({ monthAchievements: 0 })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ monthAchievements: 0 })
      return
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('checkin_records')
      .where({
        date: _.gte(monthStart)
      })
      .count()
      .then(res => {
        this.setData({ monthAchievements: res.total })
      })
      .catch(err => {
        console.error('查询本月成就失败', err)
        this.setData({ monthAchievements: 0 })
      })
  },

  // 加载最近7天打卡数据（周视图）
  loadWeekData() {
    if (!auth.isLoggedIn()) {
      this.setData({ weekData: [] })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ weekData: [] })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command
    
    // 计算最近7天的日期范围
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)

    // 初始化7天的数据
    const weekData = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo)
      date.setDate(sevenDaysAgo.getDate() + i)
      weekData.push({
        date: date,
        hasCheckin: false,
        label: this.getDayLabel(date),
        emotion: null,
        emotionLevel: 0
      })
    }

    // 并行查询打卡记录和情绪记录
    const checkinPromise = db.collection('checkin_records')
      .where({
        date: _.gte(sevenDaysAgo)
      })
      .get()
    
    const emotionPromise = db.collection('emotion_records')
      .where({
        date: _.gte(sevenDaysAgo)
      })
      .get()
      .catch(err => {
        // 如果集合不存在，返回空数组
        if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
          console.warn('emotion_records 集合不存在，跳过情绪数据加载')
          return { data: [] }
        }
        // 其他错误也返回空数组，避免影响打卡数据显示
        console.warn('查询情绪记录失败', err)
        return { data: [] }
      })
    
    Promise.all([checkinPromise, emotionPromise]).then(([checkinRes, emotionRes]) => {
      // 标记哪些天有打卡
      if (checkinRes.data && checkinRes.data.length > 0) {
        checkinRes.data.forEach(record => {
          const recordDate = new Date(record.date)
          recordDate.setHours(0, 0, 0, 0)
          const index = weekData.findIndex(item => {
            const itemDate = new Date(item.date)
            itemDate.setHours(0, 0, 0, 0)
            return itemDate.getTime() === recordDate.getTime()
          })
          if (index !== -1) {
            weekData[index].hasCheckin = true
          }
        })
      }

      // 标记情绪数据
      if (emotionRes.data && emotionRes.data.length > 0) {
        // 按日期分组情绪记录，同一天取最后一条（按createdAt排序）
        const emotionMap = new Map()
        emotionRes.data.forEach(record => {
          const recordDate = new Date(record.date)
          recordDate.setHours(0, 0, 0, 0)
          const dateKey = recordDate.getTime()
          
          if (!emotionMap.has(dateKey)) {
            emotionMap.set(dateKey, [])
          }
          emotionMap.get(dateKey).push(record)
        })
        
        // 对每个日期的记录按创建时间排序，取最后一条
        emotionMap.forEach((records, dateKey) => {
          records.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime()
            const timeB = new Date(b.createdAt || 0).getTime()
            return timeA - timeB
          })
          const lastRecord = records[records.length - 1]
          
          const index = weekData.findIndex(item => {
            const itemDate = new Date(item.date)
            itemDate.setHours(0, 0, 0, 0)
            return itemDate.getTime() === dateKey
          })
          
          if (index !== -1) {
            weekData[index].emotion = lastRecord.emotion
            weekData[index].emotionLevel = lastRecord.level || 0
          }
        })
      }

      // 计算柱状图高度（基于情绪等级，如果没有情绪则基于是否有打卡）
      const emotionUtil = require('../../utils/emotion.js')
      const maxLevel = 3 // 情绪最大等级
      let hasEmotionData = false
      
      // 先找到最大情绪等级，用于计算相对高度
      let maxEmotionLevel = 0
      weekData.forEach(item => {
        if (item.emotion && item.emotionLevel > 0) {
          maxEmotionLevel = Math.max(maxEmotionLevel, item.emotionLevel)
        }
      })
      
      // 如果没有任何情绪数据，使用默认的最大等级
      if (maxEmotionLevel === 0) {
        maxEmotionLevel = maxLevel
      }
      
      // 计算柱状图高度（使用固定高度值，而不是百分比）
      // 容器高度约280rpx（考虑emoji空间），使用rpx单位
      const maxBarHeight = 280 // 最大柱状图高度（rpx）
      
      weekData.forEach(item => {
        if (item.emotion && item.emotionLevel > 0) {
          // 有情绪记录，高度 = (情绪等级 / 最大等级) * 最大高度
          // 等级1: 33%, 等级2: 66%, 等级3: 100%
          const levelPercent = item.emotionLevel / maxLevel
          item.height = Math.max(levelPercent * maxBarHeight, 60) // 至少60rpx高度，确保可见
          item.emotionEmoji = emotionUtil.EMOTION_CONFIG[item.emotion]?.emoji[item.emotionLevel] || ''
          hasEmotionData = true
        } else if (item.hasCheckin) {
          // 有打卡但无情绪，显示最小高度（60rpx）
          item.height = 60
          item.emotionEmoji = ''
        } else {
          item.height = 0
          item.emotionEmoji = ''
        }
      })

      this.setData({ 
        weekData,
        hasEmotionData
      })
    })
    .catch(err => {
      console.error('查询最近7天打卡数据失败', err)
      this.setData({ weekData })
    })
  },

  // 加载月视图数据
  loadMonthData() {
    if (!auth.isLoggedIn()) {
      this.setData({ monthData: [], currentMonth: '' })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ monthData: [], currentMonth: '' })
      return
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthStart = new Date(year, month, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(year, month + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    // 设置当前月份显示
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    this.setData({ currentMonth: `${year}年${monthNames[month]}` })

    const db = wx.cloud.database()
    const _ = db.command

    // 初始化当月所有日期的数据
    const monthData = []
    const daysInMonth = monthEnd.getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      monthData.push({
        date: date,
        dateStr: dateStr, // 添加日期字符串，方便点击时使用
        day: i,
        hasCheckin: false
      })
    }

    // 查询打卡记录
    db.collection('checkin_records')
      .where({
        date: _.gte(monthStart).and(_.lte(monthEnd))
      })
      .get()
      .then(res => {
        // 标记哪些天有打卡
        if (res.data && res.data.length > 0) {
          res.data.forEach(record => {
            const recordDate = new Date(record.date)
            const day = recordDate.getDate()
            const index = monthData.findIndex(item => item.day === day)
            if (index !== -1) {
              monthData[index].hasCheckin = true
            }
          })
        }

        this.setData({ monthData })
      })
      .catch(err => {
        console.error('查询月视图数据失败', err)
        this.setData({ monthData })
      })
  },

  // 加载测试记录
  loadTestRecords() {
    if (!auth.isLoggedIn()) {
      this.setData({ testRecords: [] })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ testRecords: [] })
      return
    }

    const db = wx.cloud.database()

    db.collection('screening_records')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()
      .then(res => {
        const records = (res.data || []).map(record => {
          const date = new Date(record.createdAt)
          return {
            _id: record._id,
            type: record.type,
            score: record.score,
            severity: record.severity,
            date: this.formatDate(date),
            dateObj: date
          }
        })
        this.setData({ testRecords: records })
      })
      .catch(err => {
        console.error('查询测试记录失败', err)
        this.setData({ testRecords: [] })
      })
  },

  // 切换图表周期
  switchChartPeriod(e) {
    const period = e.currentTarget.dataset.period
    this.setData({
      currentPeriod: period
    })
  },

  // 查看所有记录
  viewAllRecords() {
    if (!auth.isLoggedIn()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    // 跳转到测试记录页面
    wx.navigateTo({
      url: '/pages/test-records/test-records?range=all'
    })
  },

  // 加载所有测试记录
  loadAllTestRecords(timeRange = 'all') {
    if (!wx.cloud) {
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command
    
    // 根据时间范围设置查询条件
    let query = db.collection('screening_records')
    let rangeTitle = '全部'
    
    if (timeRange === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      query = query.where({
        createdAt: _.gte(sevenDaysAgo)
      })
      rangeTitle = '近7天'
    } else if (timeRange === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      query = query.where({
        createdAt: _.gte(thirtyDaysAgo)
      })
      rangeTitle = '近30天'
    }
    
    wx.showLoading({ title: '加载中...', mask: true })
    
    query
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        wx.hideLoading()
        
        const records = (res.data || []).map(record => {
          const date = new Date(record.createdAt)
          return {
            _id: record._id,
            type: record.type,
            score: record.score,
            severity: record.severity,
            date: this.formatDate(date),
            dateObj: date
          }
        })

        if (records.length === 0) {
          wx.showModal({
            title: `测试记录（${rangeTitle}）`,
            content: '暂无测试记录',
            showCancel: false,
            confirmText: '我知道了'
          })
          return
        }

        // 显示筛选后的记录
        this.showAllRecords(records, rangeTitle)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('查询测试记录失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 显示所有测试记录
  showAllRecords(records, rangeTitle = '全部') {
    // 按日期分组
    const groupedRecords = {}
    records.forEach(record => {
      const dateKey = record.date
      if (!groupedRecords[dateKey]) {
        groupedRecords[dateKey] = []
      }
      groupedRecords[dateKey].push(record)
    })

    // 生成显示内容
    let content = ''
    // 按日期对象排序（降序，最新的在前）
    const dates = Object.keys(groupedRecords).sort((a, b) => {
      const dateA = groupedRecords[a][0].dateObj
      const dateB = groupedRecords[b][0].dateObj
      return dateB.getTime() - dateA.getTime()
    })

    if (dates.length === 0) {
      content = '暂无测试记录'
    } else {
      // 限制显示最近30条记录，避免内容过长
      const maxDisplay = 30
      let displayedCount = 0
      
      dates.forEach((date, index) => {
        if (displayedCount >= maxDisplay) return
        
        if (index > 0) content += '\n\n'
        content += `📅 ${date}\n`
        
        groupedRecords[date].forEach(record => {
          if (displayedCount >= maxDisplay) return
          const typeName = record.type === 'PHQ-9' ? '健康问卷抑郁量表PHQ-9' : 
                           record.type === 'GAD-7' ? '广泛性焦虑障碍量表GAD-7' : 
                           record.type === 'SAS' ? '焦虑自评量表 SAS' : record.type
          content += `\n${record.type === 'PHQ-9' ? '🧠' : '❤️'} ${typeName}\n`
          content += `得分：${record.score} 分\n`
          content += `${record.severity}`
          displayedCount++
        })
      })
      
      if (records.length > maxDisplay) {
        content += `\n\n... 还有 ${records.length - maxDisplay} 条记录未显示`
      }
    }

    wx.showModal({
      title: `测试记录（${rangeTitle}，共${records.length}条）`,
      content: content,
      showCancel: false,
      confirmText: '我知道了',
      success: () => {
        // 可以在这里添加跳转到详细列表页面的逻辑
      }
    })
  },

  // 查看记录详情
  viewRecordDetail(e) {
    const record = e.currentTarget.dataset.record
    if (!record) return

    const content = `${record.type}\n得分：${record.score} 分\n${record.severity}\n日期：${record.date}`
    
    wx.showModal({
      title: '测试记录详情',
      content: content,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 工具函数：获取日期标签（周几）
  getDayLabel(date) {
    const day = date.getDay()
    const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return labels[day]
  },

  // 工具函数：格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  },

  // 点击月视图日期
  onMonthDayTap(e) {
    const day = e.currentTarget.dataset.day
    const hasCheckin = e.currentTarget.dataset.hasCheckin
    const date = e.currentTarget.dataset.date
    
    if (!day) {
      return // 空日期不处理
    }

    // 构建日期字符串
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const dateObj = new Date(year, month, day)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // 加载该日期的情绪和日记
    this.loadDayDetail(dateStr, dateObj, hasCheckin)
  },

  // 加载日期详情（情绪和日记）
  loadDayDetail(dateStr, date, hasCheckin) {
    if (!wx.cloud) {
      // 即使没有云开发，也显示空详情
      this.showDayDetail(dateStr, [], null, hasCheckin)
      return
    }

    const db = wx.cloud.database()
    // 确保使用正确的日期对象
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
      this.showDayDetail(dateStr, emotions, diary, hasCheckin)
    }).catch(err => {
      console.error('加载日期详情失败', err)
      // 即使出错也显示详情（可能为空）
      this.showDayDetail(dateStr, [], null, hasCheckin)
    })
  },

  // 显示日期详情（跳转到详情页面）
  showDayDetail(dateStr, emotions, diary, hasCheckin) {
    // 直接跳转到日期详情页面
    wx.navigateTo({
      url: `/pages/day-detail/day-detail?date=${dateStr}`
    })
  },

  // 前往登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  // 加载评分趋势数据（最近7天）
  loadScoreWeekData() {
    if (!auth.isLoggedIn()) {
      this.setData({ scoreWeekData: [] })
      return
    }
    
    if (!wx.cloud) {
      this.setData({ scoreWeekData: [] })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command
    
    // 计算最近7天的日期范围
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)

    // 初始化7天的数据
    const scoreWeekData = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo)
      date.setDate(sevenDaysAgo.getDate() + i)
      scoreWeekData.push({
        date: date,
        label: this.getDayLabel(date),
        coreTotal: 0,
        deepTotal: 0,
        coreHeight: 0,
        deepHeight: 0
      })
    }

    // 查询emotion_diary集合
    db.collection('emotion_diary')
      .where({
        date: _.gte(sevenDaysAgo)
      })
      .get()
      .then(res => {
        const diaries = res.data || []
        
        // 匹配日期并填充数据
        diaries.forEach(diary => {
          const diaryDate = new Date(diary.date)
          diaryDate.setHours(0, 0, 0, 0)
          
          const index = scoreWeekData.findIndex(item => {
            const itemDate = new Date(item.date)
            itemDate.setHours(0, 0, 0, 0)
            return itemDate.getTime() === diaryDate.getTime()
          })
          
          if (index !== -1) {
            scoreWeekData[index].coreTotal = diary.coreTotal || 0
            scoreWeekData[index].deepTotal = diary.deepTotal || 0
          }
        })

        // 计算柱状图高度
        // 每日核心追踪最大30分（6个维度*5分），自我深度探索最大40分（8个维度*5分）
        const maxCoreScore = 30
        const maxDeepScore = 40
        const maxBarHeight = 280 // 最大柱状图高度（rpx），与打卡记录保持一致

        scoreWeekData.forEach(item => {
          // 计算每日核心追踪柱状图高度
          if (item.coreTotal > 0) {
            const corePercent = item.coreTotal / maxCoreScore
            item.coreHeight = Math.max(corePercent * maxBarHeight, 60) // 至少60rpx
          } else {
            item.coreHeight = 0
          }

          // 计算自我深度探索柱状图高度
          if (item.deepTotal > 0) {
            const deepPercent = item.deepTotal / maxDeepScore
            item.deepHeight = Math.max(deepPercent * maxBarHeight, 60) // 至少60rpx
          } else {
            item.deepHeight = 0
          }
        })

        this.setData({ scoreWeekData })
      })
      .catch(err => {
        // 如果集合不存在，返回空数组
        if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
          console.warn('emotion_diary 集合不存在，跳过评分数据加载')
          this.setData({ scoreWeekData })
          return
        }
        console.error('查询评分数据失败', err)
        this.setData({ scoreWeekData })
      })
  },

  // 转发给朋友
  onShareAppMessage(options) {
    return {
      title: '我的心理健康数据 - 安心宝',
      path: '/pages/data-center/data-center',
      imageUrl: '' // 可选：分享图片
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '记录心理健康，关注自我成长 - 安心宝',
      query: '',
      imageUrl: '' // 可选：分享图片
    }
  }
})

