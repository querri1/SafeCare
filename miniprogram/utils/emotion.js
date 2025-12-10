// 情绪工具函数
// 用于记录和管理用户的情绪数据

/**
 * 情绪类型定义（中医五情）
 */
const EMOTION_TYPES = {
  HAPPY: 'happy',    // 喜
  ANGRY: 'angry',    // 怒
  SAD: 'sad',        // 悲
  WORRY: 'worry',    // 忧
  FEAR: 'fear'       // 恐
}

/**
 * 情绪等级定义
 */
const EMOTION_LEVELS = {
  LOW: 1,    // 轻微
  MEDIUM: 2, // 中等
  HIGH: 3     // 强烈
}

/**
 * 情绪配置（emoji + 文字）
 */
const EMOTION_CONFIG = {
  [EMOTION_TYPES.HAPPY]: {
    name: '喜',
    emoji: {
      [EMOTION_LEVELS.LOW]: '😊',
      [EMOTION_LEVELS.MEDIUM]: '😄',
      [EMOTION_LEVELS.HIGH]: '😆'
    },
    text: {
      [EMOTION_LEVELS.LOW]: '轻微',
      [EMOTION_LEVELS.MEDIUM]: '中等',
      [EMOTION_LEVELS.HIGH]: '强烈'
    }
  },
  [EMOTION_TYPES.ANGRY]: {
    name: '怒',
    emoji: {
      [EMOTION_LEVELS.LOW]: '😐',
      [EMOTION_LEVELS.MEDIUM]: '😠',
      [EMOTION_LEVELS.HIGH]: '😡'
    },
    text: {
      [EMOTION_LEVELS.LOW]: '轻微',
      [EMOTION_LEVELS.MEDIUM]: '中等',
      [EMOTION_LEVELS.HIGH]: '强烈'
    }
  },
  [EMOTION_TYPES.SAD]: {
    name: '悲',
    emoji: {
      [EMOTION_LEVELS.LOW]: '😔',
      [EMOTION_LEVELS.MEDIUM]: '😢',
      [EMOTION_LEVELS.HIGH]: '😭'
    },
    text: {
      [EMOTION_LEVELS.LOW]: '轻微',
      [EMOTION_LEVELS.MEDIUM]: '中等',
      [EMOTION_LEVELS.HIGH]: '强烈'
    }
  },
  [EMOTION_TYPES.WORRY]: {
    name: '忧',
    emoji: {
      [EMOTION_LEVELS.LOW]: '😮‍💨',
      [EMOTION_LEVELS.MEDIUM]: '😓',
      [EMOTION_LEVELS.HIGH]: '😰'
    },
    text: {
      [EMOTION_LEVELS.LOW]: '轻微',
      [EMOTION_LEVELS.MEDIUM]: '中等',
      [EMOTION_LEVELS.HIGH]: '强烈'
    }
  },
  [EMOTION_TYPES.FEAR]: {
    name: '恐',
    emoji: {
      [EMOTION_LEVELS.LOW]: '😰',
      [EMOTION_LEVELS.MEDIUM]: '😨',
      [EMOTION_LEVELS.HIGH]: '😱'
    },
    text: {
      [EMOTION_LEVELS.LOW]: '轻微',
      [EMOTION_LEVELS.MEDIUM]: '中等',
      [EMOTION_LEVELS.HIGH]: '强烈'
    }
  }
}

/**
 * 显示情绪选择弹窗
 * @param {string} activityType - 活动类型：'baduanjin' | 'music'
 * @returns {Promise<{emotion: string, level: number} | null>} 返回选择的情绪和等级，如果取消则返回null
 */
function showEmotionSelector(activityType) {
  return new Promise((resolve) => {
    // 构建选项列表
    const itemList = []
    const emotionKeys = Object.keys(EMOTION_CONFIG)
    
    emotionKeys.forEach(emotionKey => {
      const config = EMOTION_CONFIG[emotionKey]
      const levels = [EMOTION_LEVELS.LOW, EMOTION_LEVELS.MEDIUM, EMOTION_LEVELS.HIGH]
      
      levels.forEach(level => {
        const emoji = config.emoji[level]
        const text = config.text[level]
        itemList.push(`${emoji} ${config.name}·${text}`)
      })
    })

    // 使用自定义弹窗（因为wx.showActionSheet不支持emoji显示）
    // 这里我们使用一个自定义的页面来显示
    wx.navigateTo({
      url: `/pages/emotion-selector/emotion-selector?activityType=${activityType}`,
      success: () => {
        // 监听选择结果
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        
        // 使用事件总线或全局数据来传递结果
        const app = getApp()
        app.emotionSelectorCallback = (result) => {
          resolve(result)
          delete app.emotionSelectorCallback
        }
      },
      fail: () => {
        resolve(null)
      }
    })
  })
}

/**
 * 保存情绪记录
 * @param {string} activityType - 活动类型
 * @param {string} emotion - 情绪类型
 * @param {number} level - 情绪等级
 * @returns {Promise}
 */
function saveEmotionRecord(activityType, emotion, level) {
  if (!wx.cloud) {
    return Promise.reject(new Error('云开发未初始化'))
  }

  const db = wx.cloud.database()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return db.collection('emotion_records').add({
    data: {
      activityType: activityType, // 'baduanjin' | 'music'
      emotion: emotion,           // 'happy' | 'angry' | 'sad' | 'worry' | 'fear'
      level: level,              // 1 | 2 | 3
      date: today,
      createdAt: new Date()
    }
  }).catch(err => {
    // 检查是否是集合不存在的错误
    if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('collection not exists'))) {
      const error = new Error('情绪记录集合不存在，请在云开发控制台创建 emotion_records 集合')
      error.errCode = -502005
      error.isCollectionNotExist = true
      return Promise.reject(error)
    }
    return Promise.reject(err)
  })
}

/**
 * 获取情绪显示文本
 * @param {string} emotion - 情绪类型
 * @param {number} level - 情绪等级
 * @returns {string} emoji + 文字
 */
function getEmotionDisplay(emotion, level) {
  const config = EMOTION_CONFIG[emotion]
  if (!config) return ''
  
  const emoji = config.emoji[level] || ''
  const text = config.text[level] || ''
  return `${emoji} ${config.name}·${text}`
}

/**
 * 获取情绪名称
 * @param {string} emotion - 情绪类型
 * @returns {string}
 */
function getEmotionName(emotion) {
  return EMOTION_CONFIG[emotion]?.name || ''
}

module.exports = {
  EMOTION_TYPES,
  EMOTION_LEVELS,
  EMOTION_CONFIG,
  showEmotionSelector,
  saveEmotionRecord,
  getEmotionDisplay,
  getEmotionName
}

