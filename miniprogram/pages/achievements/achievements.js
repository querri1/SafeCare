// 成就徽章页面（参考Keep的打卡成就系统）
const auth = require('../../utils/auth.js')

Page({
  data: {
    hasLogin: false,
    // 用户数据
    consecutiveDays: 0, // 连续打卡天数
    totalCheckins: 0, // 总打卡次数
    totalBaduanjin: 0, // 健身操完成次数
    totalMusic: 0, // 五音疗法完成次数
    totalTests: 0, // 测试完成次数
    // 成就列表
    achievements: [],
    unlockedCount: 0 // 已解锁成就数量
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
      this.loadUserData()
    } else {
      this.resetData()
    }
  },

  // 重置数据
  resetData() {
    this.setData({
      consecutiveDays: 0,
      totalCheckins: 0,
      totalBaduanjin: 0,
      totalMusic: 0,
      totalTests: 0,
      achievements: [],
      unlockedCount: 0
    })
  },

  // 加载用户数据
  loadUserData() {
    this.loadConsecutiveDays()
    this.loadTotalCheckins()
    this.loadActivityStats()
    this.loadTestStats()
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
          this.setData({ consecutiveDays: 0 }, () => {
            this.calculateAchievements()
          })
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
          this.setData({ consecutiveDays: 0 }, () => {
            this.calculateAchievements()
          })
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

        this.setData({ consecutiveDays: consecutive }, () => {
          this.calculateAchievements()
        })
      })
      .catch(err => {
        console.error('查询连续打卡天数失败', err)
      })
  },

  // 加载总打卡次数
  loadTotalCheckins() {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    
    db.collection('checkin_records')
      .count()
      .then(res => {
        this.setData({ totalCheckins: res.total }, () => {
          this.calculateAchievements()
        })
      })
      .catch(err => {
        console.error('查询总打卡次数失败', err)
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
        }, () => {
          this.calculateAchievements()
        })
      })
      .catch(err => {
        console.error('查询活动统计失败', err)
      })
  },

  // 加载测试统计
  loadTestStats() {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    
    db.collection('screening_records')
      .count()
      .then(res => {
        this.setData({ totalTests: res.total }, () => {
          this.calculateAchievements()
        })
      })
      .catch(err => {
        console.error('查询测试统计失败', err)
      })
  },

  // 计算成就
  calculateAchievements() {
    const { consecutiveDays, totalCheckins, totalBaduanjin, totalMusic, totalTests } = this.data

    const achievements = [
      // 连续打卡成就
      {
        id: 'consecutive_3',
        name: '初出茅庐',
        desc: '连续打卡3天',
        icon: '🔥',
        type: 'consecutive',
        target: 3,
        current: consecutiveDays,
        unlocked: consecutiveDays >= 3
      },
      {
        id: 'consecutive_7',
        name: '坚持不懈',
        desc: '连续打卡7天',
        icon: '💪',
        type: 'consecutive',
        target: 7,
        current: consecutiveDays,
        unlocked: consecutiveDays >= 7
      },
      {
        id: 'consecutive_14',
        name: '持之以恒',
        desc: '连续打卡14天',
        icon: '⭐',
        type: 'consecutive',
        target: 14,
        current: consecutiveDays,
        unlocked: consecutiveDays >= 14
      },
      {
        id: 'consecutive_30',
        name: '月度坚持',
        desc: '连续打卡30天',
        icon: '🏆',
        type: 'consecutive',
        target: 30,
        current: consecutiveDays,
        unlocked: consecutiveDays >= 30
      },
      {
        id: 'consecutive_100',
        name: '百日坚持',
        desc: '连续打卡100天',
        icon: '👑',
        type: 'consecutive',
        target: 100,
        current: consecutiveDays,
        unlocked: consecutiveDays >= 100
      },
      // 总打卡成就
      {
        id: 'total_10',
        name: '入门新手',
        desc: '累计打卡10次',
        icon: '🌱',
        type: 'total',
        target: 10,
        current: totalCheckins,
        unlocked: totalCheckins >= 10
      },
      {
        id: 'total_30',
        name: '活跃用户',
        desc: '累计打卡30次',
        icon: '🌿',
        type: 'total',
        target: 30,
        current: totalCheckins,
        unlocked: totalCheckins >= 30
      },
      {
        id: 'total_100',
        name: '打卡达人',
        desc: '累计打卡100次',
        icon: '🌳',
        type: 'total',
        target: 100,
        current: totalCheckins,
        unlocked: totalCheckins >= 100
      },
      // 活动成就
      {
        id: 'baduanjin_10',
        name: '健身操新手',
        desc: '完成健身操10次',
        icon: '🧘',
        type: 'activity',
        target: 10,
        current: totalBaduanjin,
        unlocked: totalBaduanjin >= 10
      },
      {
        id: 'baduanjin_50',
        name: '健身操达人',
        desc: '完成健身操50次',
        icon: '🧘‍♂️',
        type: 'activity',
        target: 50,
        current: totalBaduanjin,
        unlocked: totalBaduanjin >= 50
      },
      {
        id: 'music_10',
        name: '音乐疗愈者',
        desc: '完成五音疗法10次',
        icon: '🎵',
        type: 'activity',
        target: 10,
        current: totalMusic,
        unlocked: totalMusic >= 10
      },
      {
        id: 'music_50',
        name: '音乐大师',
        desc: '完成五音疗法50次',
        icon: '🎶',
        type: 'activity',
        target: 50,
        current: totalMusic,
        unlocked: totalMusic >= 50
      },
      // 测试成就
      {
        id: 'test_5',
        name: '自我了解',
        desc: '完成5次心理健康测试',
        icon: '🧠',
        type: 'test',
        target: 5,
        current: totalTests,
        unlocked: totalTests >= 5
      },
      {
        id: 'test_20',
        name: '心理健康专家',
        desc: '完成20次心理健康测试',
        icon: '💡',
        type: 'test',
        target: 20,
        current: totalTests,
        unlocked: totalTests >= 20
      }
    ]

    // 计算已解锁成就数量
    const unlockedCount = achievements.filter(a => a.unlocked).length
    
    this.setData({ 
      achievements,
      unlockedCount
    })
  },

  // 前往登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  }
})

