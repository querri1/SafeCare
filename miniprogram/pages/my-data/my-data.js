// 我的数据页面
const auth = require('../../utils/auth.js')

Page({
  data: {
    hasLogin: false,
    // 统计数据
    totalCheckins: 0, // 总打卡次数
    consecutiveDays: 0, // 连续打卡天数
    totalTests: 0, // 总测试次数
    totalBaduanjin: 0, // 健身操完成次数
    totalMusic: 0, // 五音疗法完成次数
    // 本周数据
    weekCheckins: 0,
    weekTests: 0,
    // 本月数据
    monthCheckins: 0,
    monthTests: 0
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
      this.loadAllData()
    } else {
      this.resetData()
    }
  },

  // 重置数据
  resetData() {
    this.setData({
      totalCheckins: 0,
      consecutiveDays: 0,
      totalTests: 0,
      totalBaduanjin: 0,
      totalMusic: 0,
      weekCheckins: 0,
      weekTests: 0,
      monthCheckins: 0,
      monthTests: 0
    })
  },

  // 加载所有数据
  loadAllData() {
    this.loadTotalCheckins()
    this.loadConsecutiveDays()
    this.loadTotalTests()
    this.loadActivityStats()
    this.loadWeekData()
    this.loadMonthData()
  },

  // 加载总打卡次数
  loadTotalCheckins() {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    
    db.collection('checkin_records')
      .count()
      .then(res => {
        this.setData({ totalCheckins: res.total })
      })
      .catch(err => {
        console.error('查询总打卡次数失败', err)
      })
  },

  // 加载连续打卡天数
  loadConsecutiveDays() {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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

  // 加载总测试次数
  loadTotalTests() {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    
    db.collection('screening_records')
      .count()
      .then(res => {
        this.setData({ totalTests: res.total })
      })
      .catch(err => {
        console.error('查询总测试次数失败', err)
      })
  },

  // 加载活动统计
  loadActivityStats() {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    
    db.collection('checkin_records')
      .get()
      .then(res => {
        let baduanjin = 0
        let music = 0
        
        res.data.forEach(record => {
          if (record.activities) {
            if (record.activities.includes('baduanjin')) baduanjin++
            if (record.activities.includes('music')) music++
          }
        })

        this.setData({
          totalBaduanjin: baduanjin,
          totalMusic: music
        })
      })
      .catch(err => {
        console.error('查询活动统计失败', err)
      })
  },

  // 加载本周数据
  loadWeekData() {
    if (!wx.cloud) return

    const now = new Date()
    const day = now.getDay()
    const daysToMonday = day === 0 ? 6 : day - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)

    const db = wx.cloud.database()
    const _ = db.command

    Promise.all([
      db.collection('checkin_records')
        .where({ date: _.gte(weekStart) })
        .count(),
      db.collection('screening_records')
        .where({ createdAt: _.gte(weekStart) })
        .count()
    ]).then(([checkinRes, testRes]) => {
      this.setData({
        weekCheckins: checkinRes.total,
        weekTests: testRes.total
      })
    }).catch(err => {
      console.error('查询本周数据失败', err)
    })
  },

  // 加载本月数据
  loadMonthData() {
    if (!wx.cloud) return

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)

    const db = wx.cloud.database()
    const _ = db.command

    Promise.all([
      db.collection('checkin_records')
        .where({ date: _.gte(monthStart) })
        .count(),
      db.collection('screening_records')
        .where({ createdAt: _.gte(monthStart) })
        .count()
    ]).then(([checkinRes, testRes]) => {
      this.setData({
        monthCheckins: checkinRes.total,
        monthTests: testRes.total
      })
    }).catch(err => {
      console.error('查询本月数据失败', err)
    })
  },

  // 前往登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  }
})

