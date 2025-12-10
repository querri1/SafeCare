// 健身操视频播放页面（支持标准八段锦和趣味健身操分类：消气操、自在肩颈操、本草纲目、暴汗燃脂操）
const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    videoUrl: '', // 视频URL，从云存储获取
    exerciseType: 'standard', // 练习类型：'xiaqi' 消气操, 'standard' 标准八段锦, 'shoulder' 自在肩颈操, 'herbal' 本草纲目, 'sweat' 暴汗燃脂操
    exerciseTitle: '标准八段锦', // 页面标题
    // 计时器相关
    timer: 0, // 计时器（秒）
    timerInterval: null, // 计时器定时器
    isPlaying: false, // 视频是否正在播放
    formattedTime: '00:00', // 格式化后的时间
    videoEnded: false // 视频是否已结束（用于判断是否需要重置计时器）
  },

  onLoad(options) {
    // 获取练习类型参数
    const type = options.type || 'standard'
    
    // 根据类型设置标题
    const titleMap = {
      'xiaqi': '消气操',
      'standard': '标准八段锦',
      'shoulder': '自在肩颈操',
      'herbal': '本草纲目',
      'sweat': '暴汗燃脂操'
    }
    
    this.setData({
      exerciseType: type,
      exerciseTitle: titleMap[type] || '标准八段锦'
    })
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.exerciseTitle
    })
    
    this.loadVideoFromCloud()
    this.initVideoContext()
  },

  onUnload() {
    // 页面卸载时清除计时器
    this.stopTimer()
  },

  // 初始化视频上下文
  initVideoContext() {
    this.videoContext = wx.createVideoContext('baduanjinVideo')
  },

  // 开始计时
  startTimer() {
    // 如果视频已结束，重置计时器（重新开始）
    if (this.data.videoEnded) {
      this.setData({
        timer: 0,
        formattedTime: '00:00',
        videoEnded: false
      })
      // 清除旧的计时器
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    }
    
    // 如果已经在计时，不重复启动（暂停后继续的情况）
    if (this.timerInterval) {
      this.setData({ isPlaying: true })
      return
    }
    
    // 开始新的计时
    this.setData({ isPlaying: true })
    
    this.timerInterval = setInterval(() => {
      const newTimer = this.data.timer + 1
      const minutes = Math.floor(newTimer / 60)
      const seconds = newTimer % 60
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      
      this.setData({
        timer: newTimer,
        formattedTime: formatted
      })
    }, 1000)
  },

  // 停止计时
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.setData({ isPlaying: false })
  },

  // 重置计时器
  resetTimer() {
    this.stopTimer()
    this.setData({
      timer: 0,
      formattedTime: '00:00'
    })
  },

  // 视频播放事件
  onVideoPlay() {
    // 如果计时器不存在，说明是新的播放，重置并开始计时
    // 如果计时器存在，说明是暂停后继续，继续计时
    this.startTimer()
  },

  // 视频暂停事件
  onVideoPause() {
    this.stopTimer()
  },

  // 视频停止事件
  onVideoStop() {
    this.stopTimer()
  },

  // 从云存储加载视频
  async loadVideoFromCloud() {
    wx.showLoading({ title: '加载视频中...', mask: true })
    
    try {
      let cloudPath = ''
      
      // 根据练习类型选择不同的视频
      const type = this.data.exerciseType
      if (type === 'xiaqi') {
        // 消气操视频路径（使用原来的趣味健身操视频）
        cloudPath = 'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/video/fun-exercise.mp4'
      } else if (type === 'standard') {
        // 标准八段锦视频路径
        cloudPath = 'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/video/baduanjin-9f2582a4.mp4'
      } else if (type === 'shoulder') {
        // 自在肩颈操视频路径
        // ⚠️ 重要：请将下面的路径替换为你实际上传后的 File ID
        cloudPath = 'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/video/shoulder-exercise.mp4'
      } else if (type === 'herbal') {
        // 本草纲目视频路径
        // ⚠️ 重要：请将下面的路径替换为你实际上传后的 File ID
        cloudPath = 'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/video/herbal-exercise.mp4'
      } else if (type === 'sweat') {
        // 暴汗燃脂操视频路径
        // ⚠️ 重要：请将下面的路径替换为你实际上传后的 File ID
        cloudPath = 'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/video/sweat-exercise.mp4'
      } else {
        // 默认使用标准八段锦
        cloudPath = 'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/video/baduanjin-9f2582a4.mp4'
      }
      
      console.log('准备加载视频，云存储路径:', cloudPath)
      const videoUrl = await cloudStorage.getCloudFileURL(cloudPath)
      console.log('视频URL获取成功:', videoUrl)
      
      this.setData({
        videoUrl: videoUrl
      })
      
      wx.hideLoading()
    } catch (err) {
      console.error('加载视频失败:', err)
      console.error('错误详情:', err.message || err.errMsg || JSON.stringify(err))
      wx.hideLoading()
      
      // 显示更详细的错误信息
      const errorMsg = err.message || err.errMsg || '未知错误'
      const errorCode = err.code || err.errCode || ''
      
      let errorContent = `错误信息：${errorMsg}`
      if (errorCode) {
        errorContent = `错误代码：${errorCode}\n${errorContent}`
      }
      
      // 根据错误信息提供针对性建议
      if (errorMsg.includes('不存在') || errorMsg.includes('not found') || errorCode === 602) {
        errorContent += '\n\n可能原因：\n1. 视频文件未上传到云存储\n2. 文件路径不正确\n3. 文件已被删除'
      } else if (errorMsg.includes('tempFileURL') || errorMsg.includes('为空')) {
        errorContent += '\n\n可能原因：\n1. 云存储服务异常\n2. 文件权限设置问题\n3. 网络连接问题'
      }
      
      errorContent += '\n\n请检查：\n1. 视频文件是否已上传到云存储\n2. File ID 是否正确\n3. 文件路径是否匹配\n4. 网络连接是否正常'
      
      wx.showModal({
        title: '视频加载失败',
        content: errorContent,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 视频播放完成
  onVideoEnded() {
    const exerciseTime = this.data.timer
    const minutes = Math.floor(exerciseTime / 60)
    
    // 停止计时器并标记视频已结束
    this.stopTimer()
    this.setData({ videoEnded: true })
    
    // 记录打卡
    const checkin = require('../../utils/checkin.js')
    checkin.recordCheckin('baduanjin').then(() => {
      // 显示激励性提示，然后提示记录心情
      this.showCompletionEncouragement(exerciseTime, minutes, () => {
        this.promptEmotionRecord('baduanjin')
      })
    }).catch(err => {
      console.error('记录打卡失败', err)
      this.showCompletionEncouragement(exerciseTime, minutes, () => {
        this.promptEmotionRecord('baduanjin')
      })
    })
  },

  // 显示完成激励
  showCompletionEncouragement(exerciseTime, minutes, callback) {
    // 根据锻炼时长生成不同的激励语
    let encouragement = ''
    let title = '🎉 练习完成！'
    
    if (minutes >= 15) {
      encouragement = `太棒了！你坚持了 ${minutes} 分钟，这是非常棒的成就！\n\n每一次坚持都是对自己的投资，你的身体会感谢你的努力。继续保持，你正在变得越来越健康！`
    } else if (minutes >= 10) {
      encouragement = `很好！你完成了 ${minutes} 分钟的练习。\n\n坚持就是胜利，每一次练习都在为你的健康加分。继续加油，你会看到自己的进步！`
    } else if (minutes >= 5) {
      encouragement = `不错！你完成了 ${minutes} 分钟的练习。\n\n好的开始是成功的一半，继续保持这个节奏，你会越来越棒！`
    } else {
      encouragement = `你完成了本次练习！\n\n虽然时间不长，但重要的是你开始了。坚持下去，你会收获更多！`
    }
    
    wx.showModal({
      title: title,
      content: encouragement,
      showCancel: false,
      confirmText: '继续加油',
      confirmColor: '#34D399',
      success: () => {
        // 重置计时器，准备下次练习
        this.resetTimer()
        // 执行回调（提示记录心情）
        if (callback) {
          callback()
        }
      }
    })
  },

  // 提示记录心情
  promptEmotionRecord(activityType) {
    wx.showModal({
      title: '记录心情',
      content: '完成练习后，记录一下此刻的心情吧！这有助于更好地了解自己的情绪变化。',
      confirmText: '记录心情',
      cancelText: '稍后再说',
      confirmColor: '#34D399',
      success: (res) => {
        if (res.confirm) {
          this.showEmotionSelector(activityType)
        }
      }
    })
  },

  // 显示情绪选择器
  showEmotionSelector(activityType) {
    const emotionUtil = require('../../utils/emotion.js')
    const app = getApp()
    
    // 设置回调
    app.emotionSelectorCallback = (result) => {
      if (result && result.emotion && result.level) {
        // 保存情绪记录
        emotionUtil.saveEmotionRecord(activityType, result.emotion, result.level)
          .then(() => {
            wx.showToast({
              title: '心情已记录',
              icon: 'success',
              duration: 1500
            })
            // 延迟后提示是否写日记
            setTimeout(() => {
              this.promptDiary()
            }, 1800)
          })
          .catch(err => {
            console.error('保存情绪记录失败', err)
            if (err.isCollectionNotExist || err.errCode === -502005) {
              wx.showModal({
                title: '集合不存在',
                content: '请在云开发控制台创建 emotion_records 集合\n\n操作步骤：\n1. 打开云开发控制台\n2. 进入"数据库"\n3. 点击"+"创建新集合\n4. 集合名称：emotion_records\n5. 权限设置为"仅创建者可读写"',
                showCancel: false,
                confirmText: '我知道了'
              })
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
      }
      delete app.emotionSelectorCallback
    }

    // 跳转到情绪选择页面
    wx.navigateTo({
      url: `/pages/emotion-selector/emotion-selector?activityType=${activityType}`
    })
  },

  // 提示是否写日记
  promptDiary() {
    // 随机选择一条温和的提示语
    const prompts = [
      '想不想把此刻的心情记录下来呢？写日记可以帮助你更好地了解自己✨',
      '要不要给今天的自己留个纪念？写写日记，记录下此刻的感受吧💕',
      '如果愿意的话，可以写写日记，把今天的心情和想法记录下来哦📝',
      '此刻的心情值得被记录，要不要写写日记，和今天的自己说说话呢？🌿'
    ]
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    
    wx.showModal({
      title: '💭',
      content: randomPrompt,
      showCancel: true,
      cancelText: '稍后',
      confirmText: '去写日记',
      confirmColor: '#34D399',
      success: (res) => {
        if (res.confirm) {
          // 跳转到情绪日记页面
          wx.navigateTo({
            url: '/pages/emotion-diary/emotion-diary'
          })
        }
      }
    })
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
})



