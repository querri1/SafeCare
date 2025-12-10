// 测试记录查看页面
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
    timeRange: 'all', // 时间范围：'7days', '30days', 'all'
    records: [], // 所有记录
    groupedRecords: [], // 按日期分组的记录
    totalCount: 0, // 总记录数
    isLoading: false
  },

  onLoad(options) {
    // 获取传入的时间范围参数
    const timeRange = options.range || 'all'
    this.setData({ timeRange })
    this.loadRecords()
  },

  onShow() {
    // 页面显示时刷新数据
    if (auth.isLoggedIn()) {
      this.loadRecords()
    }
  },

  // 切换时间范围
  switchTimeRange(e) {
    const range = e.currentTarget.dataset.range
    if (range === this.data.timeRange) {
      return // 相同范围，不重复加载
    }
    
    this.setData({ timeRange: range })
    this.loadRecords()
  },

  // 加载测试记录
  loadRecords() {
    if (!auth.isLoggedIn()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    if (!wx.cloud) {
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...', mask: true })

    const db = wx.cloud.database()
    const _ = db.command
    
    // 根据时间范围设置查询条件
    let query = db.collection('screening_records')
    
    if (this.data.timeRange === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      query = query.where({
        createdAt: _.gte(sevenDaysAgo)
      })
    } else if (this.data.timeRange === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      query = query.where({
        createdAt: _.gte(thirtyDaysAgo)
      })
    }
    
    query
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        wx.hideLoading()
        this.setData({ isLoading: false })
        
        const records = (res.data || []).map(record => {
          const date = new Date(record.createdAt)
          return {
            _id: record._id,
            type: record.type,
            typeName: getTestDisplayName(record.type), // 显示名称
            score: record.score,
            severity: record.severity,
            date: this.formatDate(date),
            time: this.formatTime(date),
            dateObj: date
          }
        })

        // 按日期分组
        const groupedRecords = this.groupRecordsByDate(records)
        
        this.setData({
          records: records,
          groupedRecords: groupedRecords,
          totalCount: records.length
        })
      })
      .catch(err => {
        wx.hideLoading()
        this.setData({ isLoading: false })
        console.error('查询测试记录失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 按日期分组记录
  groupRecordsByDate(records) {
    const grouped = {}
    
    records.forEach(record => {
      const dateKey = record.date
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          dateObj: record.dateObj,
          records: []
        }
      }
      grouped[dateKey].records.push(record)
    })
    
    // 转换为数组并按日期排序（最新的在前）
    const groupedArray = Object.values(grouped).sort((a, b) => {
      return b.dateObj.getTime() - a.dateObj.getTime()
    })
    
    return groupedArray
  },

  // 查看记录详情
  viewRecordDetail(e) {
    const record = e.currentTarget.dataset.record
    if (!record) return

    // 根据测试类型生成不同的详情内容
    let detailContent = `测试类型：${getTestDisplayName(record.type)}\n\n`
    detailContent += `得分：${record.score} 分\n\n`
    detailContent += `评估结果：${record.severity}\n\n`
    detailContent += `测试日期：${record.date}\n`
    detailContent += `测试时间：${record.time}`

    // 根据得分添加建议
    if (record.type === 'PHQ-9') {
      if (record.score >= 20) {
        detailContent += '\n\n💡 建议：得分较高，建议寻求专业心理健康支持。'
      } else if (record.score >= 15) {
        detailContent += '\n\n💡 建议：建议关注情绪变化，适当调整生活方式。'
      } else if (record.score >= 10) {
        detailContent += '\n\n💡 建议：保持良好心态，继续关注心理健康。'
      } else {
        detailContent += '\n\n💡 建议：情绪状态良好，继续保持。'
      }
    } else if (record.type === 'GAD-7') {
      if (record.score >= 15) {
        detailContent += '\n\n💡 建议：得分较高，建议寻求专业心理健康支持。'
      } else if (record.score >= 10) {
        detailContent += '\n\n💡 建议：建议关注焦虑情绪，适当放松和调节。'
      } else if (record.score >= 5) {
        detailContent += '\n\n💡 建议：轻度焦虑，保持良好心态。'
      } else {
        detailContent += '\n\n💡 建议：焦虑水平正常，继续保持。'
      }
    }
    
    wx.showModal({
      title: '测试记录详情',
      content: detailContent,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#34D399'
    })
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  },

  // 格式化时间
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
})

