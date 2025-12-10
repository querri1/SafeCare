// 情绪日记评分工具函数
// 定义评分维度和提示语

// 每日核心追踪（6个维度）
const CORE_TRACKING = [
  {
    key: 'emotionStability',
    name: '情绪平稳度',
    hint: '0=大起大落，5=如湖面平静'
  },
  {
    key: 'pressurePerception',
    name: '压力感知值',
    hint: '0=无法承受之重，5=轻松无压'
  },
  {
    key: 'bodyRelaxation',
    name: '身体放松感',
    hint: '0=全身紧绷（尤其肩颈、胸部），5=完全松弛'
  },
  {
    key: 'sleepRecovery',
    name: '睡眠修复力',
    hint: '0=彻夜难眠/多梦，5=一夜甜睡，醒后清爽'
  },
  {
    key: 'positiveEnergy',
    name: '正向能量值',
    hint: '0=心力枯竭，5=心怀希望与愉悦'
  },
  {
    key: 'healthControl',
    name: '健康掌控感',
    hint: '0=被担忧淹没，5=我能积极管理我的健康'
  }
]

// 自我深度探索（8个维度）
const DEEP_EXPLORATION = [
  {
    key: 'dietNourishment',
    name: '饮食滋养度',
    hint: '今天摄入的食物（如蔬果、优质蛋白）是否感觉滋养身体？'
  },
  {
    key: 'exerciseComfort',
    name: '运动舒畅感',
    hint: '今天身体活动（如散步、瑜伽）后是否感到舒畅而非疲惫？'
  },
  {
    key: 'screenDetachment',
    name: '屏幕游离度',
    hint: '能否主动从手机/工作中抽离，让心神休息？（分数越高，表示抽离越好）'
  },
  {
    key: 'anxietyRumination',
    name: '焦虑反刍度',
    hint: '被反复的担忧念头困扰的程度？（分数越低，表示困扰越深）'
  },
  {
    key: 'selfCompassion',
    name: '自我关怀度',
    hint: '今天像对待好朋友一样，理解和善待自己的程度？'
  },
  {
    key: 'bodyAttention',
    name: '身体关注度',
    hint: '对自身身体异常的关注是适度的觉察，还是过度的担忧？（分数越低，表示越过度担忧）'
  },
  {
    key: 'communicationSmoothness',
    name: '沟通顺畅度',
    hint: '能否真诚、顺畅地表达自己的感受和需求？'
  },
  {
    key: 'relationshipSupport',
    name: '关系支持感',
    hint: '从家人/朋友处感受到被理解和支持的程度？'
  }
]

// 每日提醒词
const DAILY_REMINDERS = [
  '亲爱的，今天你的身体和心情都好吗？花一分钟，照顾一下自己的感受吧。今天的你愿意给自己打几分呢？',
  '今天过得怎么样？给自己一点时间，温柔地感受一下此刻的状态吧。',
  '亲爱的你，此刻的心情和身体都在诉说着什么？让我们一起来倾听吧。'
]

/**
 * 获取每日提醒词（随机）
 */
function getDailyReminder() {
  const index = Math.floor(Math.random() * DAILY_REMINDERS.length)
  return DAILY_REMINDERS[index]
}

/**
 * 计算板块总分
 * @param {object} scores - 评分对象
 * @param {array} dimensions - 维度数组
 * @returns {number} 总分
 */
function calculateTotalScore(scores, dimensions) {
  if (!scores || !dimensions) return 0
  let total = 0
  let count = 0
  dimensions.forEach(dim => {
    const score = scores[dim.key]
    if (score !== null && score !== undefined && score >= 0 && score <= 5) {
      total += score
      count++
    }
  })
  return count > 0 ? total : 0
}

/**
 * 检查是否有低分板块
 * 每日核心追踪：总分≤12分显示提示
 * 自我深度探索：总分≤16分显示提示
 * @param {object} scores - 评分对象
 * @returns {object} {hasLowScore: boolean, lowScoreBlock: string|null}
 */
function checkLowScore(scores) {
  if (!scores) return { hasLowScore: false, lowScoreBlock: null }
  
  const coreTotal = calculateTotalScore(scores, CORE_TRACKING)
  const deepTotal = calculateTotalScore(scores, DEEP_EXPLORATION)
  
  // 每日核心追踪：总分≤12分
  // 自我深度探索：总分≤16分
  const coreLow = coreTotal > 0 && coreTotal <= 12
  const deepLow = deepTotal > 0 && deepTotal <= 16
  
  if (coreLow && deepLow) {
    return { hasLowScore: true, lowScoreBlock: 'both' }
  } else if (coreLow) {
    return { hasLowScore: true, lowScoreBlock: 'core' }
  } else if (deepLow) {
    return { hasLowScore: true, lowScoreBlock: 'deep' }
  }
  
  return { hasLowScore: false, lowScoreBlock: null }
}

/**
 * 获取低分关怀提示语
 * @param {string} block - 板块名称 ('core' | 'deep' | 'both')
 * @returns {string} 提示语
 */
function getLowScorePrompt(block) {
  const blockNames = {
    core: '每日核心追踪',
    deep: '自我深度探索',
    both: '每日核心追踪和自我深度探索'
  }
  const blockName = blockNames[block] || '这些板块'
  return `亲爱的，我注意到你给自己${blockName}分数比较低。如果愿意，可以多说一句是什么让你感到沉重吗？不说也没关系，看见它也已经很棒啦。`
}

/**
 * 检查单个板块是否有低分
 * 每日核心追踪：总分≤12分显示提示
 * 自我深度探索：总分≤16分显示提示
 * @param {object} scores - 评分对象
 * @param {array} dimensions - 维度数组
 * @param {string} blockType - 板块类型 'core' 或 'deep'（可选，用于更准确的判断）
 * @returns {boolean} 是否有低分
 */
function checkSingleBlockLowScore(scores, dimensions, blockType) {
  if (!scores || !dimensions) return false
  const total = calculateTotalScore(scores, dimensions)
  
  // 如果提供了板块类型，直接使用
  if (blockType === 'core') {
    // 每日核心追踪：总分≤12分
    return total > 0 && total <= 12
  } else if (blockType === 'deep') {
    // 自我深度探索：总分≤16分
    return total > 0 && total <= 16
  }
  
  // 如果没有提供板块类型，通过维度数量判断
  // 每日核心追踪：6个维度，总分≤12分
  if (dimensions.length === CORE_TRACKING.length) {
    return total > 0 && total <= 12
  }
  
  // 自我深度探索：8个维度，总分≤16分
  if (dimensions.length === DEEP_EXPLORATION.length) {
    return total > 0 && total <= 16
  }
  
  // 默认情况（不应该发生）
  return false
}

module.exports = {
  CORE_TRACKING,
  DEEP_EXPLORATION,
  getDailyReminder,
  calculateTotalScore,
  checkLowScore,
  getLowScorePrompt,
  checkSingleBlockLowScore
}

