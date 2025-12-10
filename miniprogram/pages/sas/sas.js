// SAS 焦虑自评量表页面
// 评分：1=没有或很少时间, 2=小部分时间, 3=相当多时间, 4=绝大部分或全部时间
// 反向计分题：5、9、13、17、19（按4、3、2、1计分）
Page({
  data: {
    questions: [
      { text: '我觉得比平时容易紧张和着急', reverse: false },
      { text: '我无缘无故地感到害怕', reverse: false },
      { text: '我容易心里烦乱或觉得惊慌', reverse: false },
      { text: '我觉得我可能将要发疯（发疯感）', reverse: false },
      { text: '我觉得一切都很好，也不会发生什么不幸', reverse: true }, // 反向
      { text: '我手脚发抖打颤', reverse: false },
      { text: '我因为头痛、头颈痛和背痛而苦恼（躯体疼痛）', reverse: false },
      { text: '我感觉容易衰弱和疲乏（乏力）', reverse: false },
      { text: '我觉得心平气和，并且容易安静地坐着', reverse: true }, // 反向
      { text: '我觉得心跳得很快（心悸）', reverse: false },
      { text: '我因为一阵阵头晕而苦恼（头昏）', reverse: false },
      { text: '我有晕倒发作，或觉得要晕倒似的（晕厥感）', reverse: false },
      { text: '我吸气呼气都感到很容易(呼吸困难)', reverse: true }, // 反向
      { text: '我手脚麻木和刺痛（手足刺痛）', reverse: false },
      { text: '我因胃痛和消化不良而苦恼（胃痛或者消化不良）', reverse: false },
      { text: '我常常要小便', reverse: false },
      { text: '我的手常常是干燥温暖的', reverse: true }, // 反向
      { text: '我脸红发热（面部潮红）', reverse: false },
      { text: '我容易入睡并且一夜睡得很好（睡眠障碍）', reverse: true }, // 反向
      { text: '我做恶梦（恶梦）', reverse: false }
    ],
    options: [
      { label: 'A', text: '没有或很少时间', value: 1 },
      { label: 'B', text: '小部分时间', value: 2 },
      { label: 'C', text: '相当多时间', value: 3 },
      { label: 'D', text: '绝大部分或全部时间', value: 4 }
    ],
    answers: [], // 每题选项的分值（原始值，未反向）
    currentIndex: 0, // 当前题目索引（0-19）
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

    // 计算总粗分（考虑反向计分）
    let rawScore = 0
    this.data.answers.forEach((value, index) => {
      const question = this.data.questions[index]
      if (question.reverse) {
        // 反向计分：1->4, 2->3, 3->2, 4->1
        rawScore += (5 - value)
      } else {
        rawScore += value
      }
    })

    // 计算标准分（总粗分 × 1.25，取整数部分）
    const standardScore = Math.floor(rawScore * 1.25)
    const severity = this.getSeverity(standardScore)

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
        type: 'SAS',
        answers: this.data.answers,
        rawScore,
        score: standardScore, // 标准分
        severity,
        createdAt: new Date()
      }
    }).then(() => {
      // 记录打卡
      checkin.recordCheckin('sas').catch(err => {
        console.error('记录打卡失败', err)
      })
      this.showResult(standardScore, severity, rawScore)
    }).catch(err => {
      console.error('保存SAS结果失败', err)
      wx.showToast({
        title: '保存结果失败',
        icon: 'none'
      })
      // 即便保存失败，也展示结果
      this.showResult(standardScore, severity, rawScore)
    })
  },

  // 根据标准分给出严重程度
  getSeverity(standardScore) {
    if (standardScore < 50) return '正常'
    if (standardScore < 60) return '轻度焦虑'
    if (standardScore < 70) return '中度焦虑'
    return '重度焦虑'
  },

  // 获取严重程度的描述（非病理化语言）
  getSeverityDescription(standardScore) {
    if (standardScore < 50) {
      return {
        title: '你的情绪状态良好',
        desc: '你的情绪近两周保持稳定，这是很好的状态。继续保持，关注自己的身心健康。',
        color: '#34D399'
      }
    } else if (standardScore < 60) {
      return {
        title: '你最近可能有些压力',
        desc: '你的情绪近两周略显波动，可能正在经历一些压力。这是常见且可改善的，建议适当放松和调节。',
        color: '#FBBF24'
      }
    } else if (standardScore < 70) {
      return {
        title: '你可能正在经历较多压力',
        desc: '你的情绪近两周出现较明显的波动，可能正在经历较多压力。建议关注自己的情绪变化，适当寻求支持。',
        color: '#F97316'
      }
    } else {
      return {
        title: '你最近可能承受了较大压力',
        desc: '你的情绪近两周出现明显波动，可能承受了较大压力。建议关注自己的情绪变化，考虑寻求专业支持。',
        color: '#EF4444'
      }
    }
  },

  // 展示结果说明（图形化）
  showResult(standardScore, severity, rawScore) {
    const severityInfo = this.getSeverityDescription(standardScore)
    
    // 计算进度百分比（以70为上限，超过70显示100%）
    const maxScore = 70
    const progressPercent = Math.min((standardScore / maxScore) * 100, 100)
    
    // 跳转到结果页面
    wx.redirectTo({
      url: `/pages/sas-result/sas-result?score=${standardScore}&severity=${severity}&rawScore=${rawScore}&progress=${progressPercent}&title=${encodeURIComponent(severityInfo.title)}&desc=${encodeURIComponent(severityInfo.desc)}&color=${severityInfo.color}`
    })
  }
})

