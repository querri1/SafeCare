// 打卡工具函数
// 用于记录用户的打卡行为
const auth = require('./auth.js')

/**
 * 记录打卡
 * @param {string} activityType - 活动类型：'baduanjin' | 'music' | 'phq9' | 'gad7'
 * @returns {Promise} 返回Promise
 */
function recordCheckin(activityType) {
  // 检查是否已登录
  if (!auth.isLoggedIn()) {
    console.warn('用户未登录，无法记录打卡')
    return Promise.reject(new Error('用户未登录'))
  }
  
  if (!wx.cloud) {
    console.error('云开发未初始化')
    return Promise.reject(new Error('云开发未初始化'))
  }

  const db = wx.cloud.database()
  const _ = db.command
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 检查今天是否已经打卡（避免重复打卡）
  return db.collection('checkin_records')
    .where({
      date: _.gte(today).and(_.lt(tomorrow))
    })
    .get()
    .then(res => {
      // 如果今天已经有打卡记录，则更新活动类型列表
      if (res.data && res.data.length > 0) {
        const existingRecord = res.data[0]
        // 如果该活动类型已经记录过，则不再重复添加
        if (existingRecord.activities && existingRecord.activities.includes(activityType)) {
          return Promise.resolve()
        }
        // 更新现有记录，添加新的活动类型
        const activities = existingRecord.activities || []
        activities.push(activityType)
        return db.collection('checkin_records')
          .doc(existingRecord._id)
          .update({
            data: {
              activities: activities,
              updatedAt: new Date()
            }
          })
      } else {
        // 创建新的打卡记录
        // 如果遇到重复键错误（E11000），说明在查询和插入之间已经有其他请求插入了记录
        // 此时需要重新查询并更新
        return db.collection('checkin_records').add({
          data: {
            date: today,
            activities: [activityType],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }).catch(err => {
          // 处理重复键错误（E11000 duplicate key error）
          if (err.errCode === -502001 && err.errMsg && err.errMsg.includes('E11000')) {
            console.warn('检测到重复键错误，重新查询并更新记录')
            // 重新查询今天的记录
            return db.collection('checkin_records')
              .where({
                date: _.gte(today).and(_.lt(tomorrow))
              })
              .get()
              .then(res => {
                if (res.data && res.data.length > 0) {
                  const existingRecord = res.data[0]
                  // 如果该活动类型已经记录过，则不再重复添加
                  if (existingRecord.activities && existingRecord.activities.includes(activityType)) {
                    return Promise.resolve()
                  }
                  // 更新现有记录，添加新的活动类型
                  const activities = existingRecord.activities || []
                  activities.push(activityType)
                  return db.collection('checkin_records')
                    .doc(existingRecord._id)
                    .update({
                      data: {
                        activities: activities,
                        updatedAt: new Date()
                      }
                    })
                } else {
                  // 如果重新查询还是没有记录，抛出原始错误
                  return Promise.reject(err)
                }
              })
          } else {
            // 其他错误直接抛出
            return Promise.reject(err)
          }
        })
      }
    })
    .catch(err => {
      console.error('记录打卡失败', err)
      return Promise.reject(err)
    })
}

module.exports = {
  recordCheckin
}

