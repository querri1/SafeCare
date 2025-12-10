// PHQ-9 抑郁筛查页面
// 评分：0=完全没有, 1=几天, 2=一半以上天数, 3=几乎每天
Page({
  data: {
    questions: [
      { text: '做事提不起兴趣' },
      { text: '情绪低落、沮丧或绝望' },
      { text: '入睡困难、易醒或睡太多' },
      { text: '感到疲倦或没有精力' },
      { text: '食欲不振或暴饮暴食' },
      { text: '觉得自己很失败或让人失望' },
      { text: '很难集中注意力（如看书、看电视）' },
      { text: '动作或说话缓慢/坐立不安、烦躁易怒' },
      { text: '有伤害自己的念头' }
    ],
    options: [
      { label: 'A', text: '完全没有', value: 0 },
      { label: 'B', text: '几天', value: 1 },
      { label: 'C', text: '一半以上天数', value: 2 },
      { label: 'D', text: '几乎每天', value: 3 }
    ],
    answers: [], // 每题选项的分值
    currentIndex: 0, // 当前题目索引
    canSubmit: false,
    remainingCount: 0 // 未完成的题目数量
  },

  onLoad() {
    // 初始化答案数组
    const answers = new Array(this.data.questions.length).fill(null)
    this.setData({ 
      answers,
      remainingCount: this.data.questions.length
    })
  },

  // 选中某个选项
  onSelectOption(e) {
    const value = parseInt(e.currentTarget.dataset.value)
    const currentIndex = this.data.currentIndex
    
    const answers = this.data.answers.slice()
    answers[currentIndex] = value
    
    // 检查是否可以提交（所有题目都已回答）
    const canSubmit = answers.every(v => v !== null)
    
    // 计算未完成的题目数量
    const remainingCount = answers.filter(v => v === null).length
    
    // 如果已回答，自动进入下一题（最后一题除外）
    let nextIndex = currentIndex
    if (canSubmit) {
      // 所有题目都答完了，停留在最后一题
      nextIndex = this.data.questions.length - 1
    } else {
      // 找到下一个未答的题目
      for (let i = currentIndex + 1; i < this.data.questions.length; i++) {
        if (answers[i] === null) {
          nextIndex = i
          break
        }
      }
    }
    
    this.setData({
      answers,
      currentIndex: nextIndex,
      canSubmit,
      remainingCount
    })
    
    // 如果还有未答的题目，滚动到下一题
    if (!canSubmit && nextIndex > currentIndex) {
      wx.nextTick(() => {
        this.scrollToQuestion(nextIndex)
      })
    }
  },

  // 滚动到指定题目
  scrollToQuestion(index) {
    const query = wx.createSelectorQuery()
    query.select(`#question-${index}`).boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) => {
      if (res[0]) {
        wx.pageScrollTo({
          scrollTop: res[1].scrollTop + res[0].top - 100,
          duration: 300
        })
      }
    })
  },

  // 跳转到指定题目
  goToQuestion(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentIndex: index })
    this.scrollToQuestion(index)
  },

  // 上一题
  goToPrevious() {
    if (this.data.currentIndex > 0) {
      const prevIndex = this.data.currentIndex - 1
      this.setData({ currentIndex: prevIndex })
      this.scrollToQuestion(prevIndex)
    }
  },

  // 下一题
  goToNext() {
    if (this.data.currentIndex < this.data.questions.length - 1) {
      const nextIndex = this.data.currentIndex + 1
      this.setData({ currentIndex: nextIndex })
      this.scrollToQuestion(nextIndex)
    }
  },

  // 提交量表
  onSubmit() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请先完成所有题目',
        icon: 'none'
      })
      return
    }

    const score = this.data.answers.reduce((sum, v) => sum + v, 0)
    const severity = this.getSeverity(score)

    // 保存到云开发数据库
    if (!wx.cloud) {
      wx.showToast({
        title: '请升级基础库以使用云开发',
        icon: 'none'
      })
      return
    }

    const db = wx.cloud.database()
    const checkin = require('../../utils/checkin.js')
    
    db.collection('screening_records').add({
      data: {
        type: 'PHQ-9',
        answers: this.data.answers,
        score,
        severity,
        createdAt: new Date()
      }
    }).then(() => {
      // 记录打卡
      checkin.recordCheckin('phq9').catch(err => {
        console.error('记录打卡失败', err)
      })
      this.showResult(score, severity)
    }).catch(err => {
      console.error('保存PHQ-9结果失败', err)
      wx.showToast({
        title: '保存结果失败',
        icon: 'none'
      })
      // 即便保存失败，也展示结果
      this.showResult(score, severity)
    })
  },

  // 根据总分给出严重程度
  getSeverity(score) {
    if (score <= 4) return '无或最轻微抑郁症状'
    if (score <= 9) return '轻度抑郁症状'
    if (score <= 14) return '中度抑郁症状'
    if (score <= 27) return '中重度至重度抑郁症状'
    return '未定义'
  },

  // 展示结果说明
  showResult(score, severity) {
    const hasSelfHarmIdea = this.data.answers[8] !== null && this.data.answers[8] >= 1

    // 使用非病理化语言
    let title = '你的情绪状态'
    let content = ''
    
    if (score <= 4) {
      title = '你的情绪状态良好'
      content = '你的情绪近两周保持稳定，这是很好的状态。继续保持，关注自己的身心健康。'
    } else if (score <= 9) {
      title = '你最近可能有些压力'
      content = '你的情绪近两周略显波动，可能正在经历一些压力。这是常见且可改善的，建议适当放松和调节。'
    } else if (score <= 14) {
      title = '你可能正在经历较多压力'
      content = '你的情绪近两周出现较明显的波动，可能正在经历较多压力。建议关注自己的情绪变化，适当寻求支持。'
    } else {
      title = '你最近可能承受了较大压力'
      content = '你的情绪近两周出现明显波动，可能承受了较大压力。建议关注自己的情绪变化，考虑寻求专业支持。'
    }

    content += '\n\n本量表仅用于自我了解，不能代替专业诊断。如感到困扰，可以考虑寻求专业支持。'

    if (hasSelfHarmIdea) {
      content += '\n\n【重要提示】\n由于你在"有伤害自己的念头"一题中出现了相关情况，建议尽快联系家人、朋友或专业机构寻求帮助，如有紧急危险请立即就医。'
    }

    wx.showModal({
      title: title,
      content,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#34D399'
    })
  }
})
