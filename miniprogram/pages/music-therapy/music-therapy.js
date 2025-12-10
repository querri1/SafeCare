// 五音疗法选择页面
// 说明：
// - 支持所有五音（角、徵、宫、商、羽）音频播放
// - 音频播放使用云存储音频，需要在云开发控制台上传音频文件
const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    selectedMusic: null,
    currentMusicType: null,
    isPlaying: false,
    currentIndex: 0,
    isLoading: false, // 是否正在加载音频
    // 五音配置：音律名称和描述
    musicConfig: {
      jue: { name: '角音', desc: '疏肝理气', effect: '疏肝理气，缓解压力' },
      zhi: { name: '徵音', desc: '振奋精神', effect: '振奋精神，增强活力' },
      gong: { name: '宫音', desc: '舒缓情绪', effect: '舒缓情绪，增强食欲' },
      shang: { name: '商音', desc: '清肺润燥', effect: '清肺润燥，缓解咳嗽' },
      yu: { name: '羽音', desc: '滋阴补肾', effect: '滋阴补肾，安神助眠' }
    },
    // ⚠️ 重要：角音播放列表（云存储路径，上传后需要替换为实际 File ID）
    // 格式：cloud://环境ID.云存储标识/audio/jue/文件名.mp3
    juePlaylistCloudPaths: [
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-01-jiangnan-sizhu.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-02-caomu-qingqing.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-03-liezi-yufeng.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-04-jiangnan-hao.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-05-gusuxing-orc.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-06-hujia-shibapai.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-08-chunfeng-deyi.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-09-mumin-xinge.mp3.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-10-zhuangzhou-mengdie.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-11-gusuxing-yuxunfa.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/jue/jue-12-zhegufei.mp3'
    ],
    jueSongNames: [
      '江南丝竹', '草木青青', '列子御风', '江南好', '姑苏行', '胡笳十八拍',
      '春风得意', '牧民新歌', '庄周梦蝶', '姑苏行·雨寻法', '鹧鸪飞'
    ],
    // 徵音播放列表（6首）
    zhiPlaylistCloudPaths: [
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/zhi/zhi-01-zizhu-diao.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/zhi/zhi-02-xiyangyang.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/zhi/zhi-03-xi-xiangfeng.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/zhi/zhi-04-wenwang-cao.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/zhi/zhi-05-shanju-yin.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/zhi/zhi-06-bubugao.mp3'
    ],
    zhiSongNames: ['紫竹调', '喜洋洋', '喜相逢', '文王操', '山居吟', '步步高'],
    // 宫音播放列表（9首）
    gongPlaylistCloudPaths: [
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-01-yueguang-zoumingqu.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-02-yueer-gao.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-03-xianju-yin.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-04-shimian-maifu.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-05-saishang-qu.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-06-qiuhu-yueye.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-07-pinghu-qiuyue.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-08-liangxiao.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/gong/gong-09-chunjiang-huayueye.mp3'
    ],
    gongSongNames: ['月光奏鸣曲', '月儿高', '闲居吟', '十面埋伏', '塞上曲', '秋湖月夜', '平湖秋月', '良宵', '春江花月夜'],
    // 商音播放列表（10首）
    shangPlaylistCloudPaths: [
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-01-changqing.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-02-yangchun-baixue.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-03-xiujin-bian.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-04-gai-gu-yin.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-05-jinshe-kuangwu.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-06-jiangjun-ling.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-07-huanghe.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-08-heming-jiugao.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-09-guangling-san.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/shang/shang-10-baixue.mp3'
    ],
    shangSongNames: ['长清', '阳春白雪', '绣金匾', '概古吟', '金蛇狂舞', '将军令', '黄河', '鹤鸣九皋', '广陵散', '白雪'],
    // 羽音播放列表（5首）
    yuPlaylistCloudPaths: [
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/yu/yu-01-pingsha-luoyan.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/yu/yu-02-meihua-sannong.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/yu/yu-03-liangzhu.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/yu/yu-04-hangong-qiuyue.mp3',
      'cloud://cloud1-4ghau10w942b2505.636c-cloud1-4ghau10w942b2505-1390238648/audio/yu/yu-05-erquan-yingyue.mp3'
    ],
    yuSongNames: ['平沙落雁', '梅花三弄', '梁祝', '汉宫秋月', '二泉映月'],
    // 存储转换后的临时URL（按音律类型存储）
    playlists: {}, // { jue: [], zhi: [], gong: [], shang: [], yu: [] }
    playlistData: {} // { jue: [], zhi: [], gong: [], shang: [], yu: [] }
  },

  onLoad() {
    // 初始化音频上下文
    this.initAudioContext()
  },

  // 加载指定音律的音频URL（按需加载）
  async loadAudioURLs(musicType) {
    const cloudPathsKey = `${musicType}PlaylistCloudPaths`
    const songNamesKey = `${musicType}SongNames`
    
    const cloudPaths = this.data[cloudPathsKey]
    const songNames = this.data[songNamesKey]
    
    if (!cloudPaths || cloudPaths.length === 0) {
      console.warn(`未配置${musicType}音频云存储路径`)
      return { success: false, message: '未配置音频路径' }
    }

    try {
      wx.showLoading({ title: '加载音频中...', mask: true })
      const urls = await cloudStorage.getCloudFileURLs(cloudPaths)
      // 过滤掉空值（某些文件可能不存在）
      const validUrls = urls.filter(url => url !== null && url !== '')
      
      wx.hideLoading()
      
      if (validUrls.length === 0) {
        wx.showModal({
          title: '音频加载失败',
          content: '所有音频文件都无法加载。\n\n错误原因：STORAGE_EXCEED_AUTHORITY（权限超出）\n\n解决方案：\n1. 打开微信云开发控制台\n2. 进入"存储" → 找到音频文件\n3. 点击文件，修改权限为"所有用户可读"\n4. 或设置为"仅创建者可读写"（需要登录）\n\n注意：安卓端必须使用临时URL，不能直接使用File ID',
          showCancel: false,
          confirmText: '我知道了'
        })
        return { success: false, message: '所有音频加载失败' }
      }
      
      // 构建播放列表数据（包含URL和名称，保留原始索引）
      const playlist = []
      urls.forEach((url, originalIndex) => {
        if (url && url !== '') {
          playlist.push({
            url: url,
            name: songNames[originalIndex] || `曲目 ${originalIndex + 1}`,
            index: originalIndex // 保留原始索引，用于播放时定位
          })
        }
      })
      
      // 更新对应音律的播放列表
      const playlists = { ...this.data.playlists }
      const playlistData = { ...this.data.playlistData }
      playlists[musicType] = urls // 保留所有URL（包括null），用于索引对应
      playlistData[musicType] = playlist // 只包含有效URL的列表，用于显示
      
      this.setData({
        playlists,
        playlistData
      })
      
      console.log(`${musicType}音频URL加载完成，共`, validUrls.length, '首，失败', urls.length - validUrls.length, '首')
      
      if (validUrls.length < urls.length) {
        const failedCount = urls.length - validUrls.length
        wx.showModal({
          title: '部分音频加载失败',
          content: `成功加载 ${validUrls.length} 首，失败 ${failedCount} 首。\n\n失败原因可能是：\n1. 云存储文件权限设置问题\n2. 文件不存在或路径错误\n\n请检查云存储文件权限设置。`,
          showCancel: false,
          confirmText: '我知道了'
        })
      }
      
      return { success: true, playlist, playlistData: playlist }
    } catch (err) {
      console.error(`加载${musicType}音频URL失败:`, err)
      wx.hideLoading()
      wx.showModal({
        title: '音频加载失败',
        content: `错误信息：${err.message || '未知错误'}\n\n请检查：\n1. 云存储文件是否已上传\n2. 文件路径是否正确\n3. 网络连接是否正常`,
        showCancel: false,
        confirmText: '我知道了'
      })
      return { success: false, message: err.message || '未知错误' }
    }
  },

  onUnload() {
    // 清除定时器
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
      this.loadingTimeout = null
    }
    // 隐藏loading
    wx.hideLoading()
    if (this.innerAudioContext) {
      this.innerAudioContext.stop()
      this.innerAudioContext.destroy()
    }
  },

  onHide() {
    if (this.innerAudioContext && this.data.isPlaying) {
      this.innerAudioContext.pause()
      this.setData({ isPlaying: false })
    }
  },

  // 选择音律
  selectMusic(e) {
    const type = e.currentTarget.dataset.type
    const name = e.currentTarget.dataset.name

    // 所有音律都支持，显示确认弹窗
    wx.showModal({
      title: '确认选择',
      content: `您选择了${name}，是否开始疗愈？`,
      success: (res) => {
        if (res.confirm) {
          this.startMusicTherapy(type, name)
        }
      }
    })
  },

  // 开始音乐疗法（支持所有音律）
  async startMusicTherapy(type, name) {
    // 检查是否已加载该音律的音频
    if (!this.data.playlistData[type] || this.data.playlistData[type].length === 0) {
      // 加载音频URL
      const result = await this.loadAudioURLs(type)
      if (!result.success) {
        wx.showToast({
          title: '音频加载失败',
          icon: 'none',
          duration: 2000
        })
        return
      }
    }

    // 初次进入时随机选择一个有效曲目作为起始，然后按列表顺序循环
    const playlistData = this.data.playlistData[type] || []
    let randomIndex = 0
    if (playlistData.length > 0) {
      // 从有效曲目中随机选择
      const randomItem = playlistData[Math.floor(Math.random() * playlistData.length)]
      randomIndex = randomItem.index
    }

    this.setData({
      selectedMusic: name,
      currentMusicType: type,
      currentIndex: randomIndex
    })

    wx.showToast({
      title: `开始${name}疗愈`,
      icon: 'success',
      duration: 1500
    })

    // 播放当前音律的乐曲
    this.playCurrentMusic()
  },

  // 确保音频上下文存在且有效
  ensureAudioContext() {
    if (!this.innerAudioContext) {
      console.log('音频上下文不存在，重新创建')
      this.initAudioContext()
    }
    return this.innerAudioContext
  },

  // 初始化音频上下文
  initAudioContext() {
    // 如果已存在，先销毁
    if (this.innerAudioContext) {
      try {
        this.innerAudioContext.stop()
        this.innerAudioContext.destroy()
      } catch (e) {
        console.warn('销毁旧音频上下文失败', e)
      }
    }

    // 创建新的音频上下文
    this.innerAudioContext = wx.createInnerAudioContext()
    
    // 设置音频播放参数
    this.innerAudioContext.volume = 1.0
    this.innerAudioContext.obeyMuteSwitch = false
    this.innerAudioContext.autoplay = false
    
    // 绑定事件
    this.bindAudioEvents()
  },

  // 绑定音频事件
  bindAudioEvents() {
    if (!this.innerAudioContext) return

    this.innerAudioContext.onPlay(() => {
      console.log('音频开始播放')
      // 音频开始播放时，隐藏加载提示
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout)
        this.loadingTimeout = null
      }
      // 确保隐藏loading（配对使用）
      if (this.data.isLoading) {
        wx.hideLoading()
      }
      this.setData({ 
        isPlaying: true,
        isLoading: false
      })
      
      // 真机调试：检查音频状态
      console.log('播放状态检查:')
      console.log('- src:', this.innerAudioContext.src)
      console.log('- volume:', this.innerAudioContext.volume)
      console.log('- obeyMuteSwitch:', this.innerAudioContext.obeyMuteSwitch)
      console.log('- paused:', this.innerAudioContext.paused)
      console.log('- buffered:', this.innerAudioContext.buffered)
    })

    this.innerAudioContext.onPause(() => {
      console.log('音频已暂停')
      this.setData({ isPlaying: false })
    })

    this.innerAudioContext.onStop(() => {
      console.log('音频已停止')
      this.setData({ isPlaying: false })
    })

    this.innerAudioContext.onEnded(() => {
      console.log('音频播放结束')
      const { currentIndex, currentMusicType, playlists, playlistData } = this.data
      if (!currentMusicType) return
      
      const currentPlaylist = playlists[currentMusicType] || []
      if (!currentPlaylist || currentPlaylist.length === 0) return
      
      // 找到下一首有效歌曲
      let nextIndex = (currentIndex + 1) % currentPlaylist.length
      let attempts = 0
      const maxAttempts = currentPlaylist.length
      
      // 如果下一首无效，继续找下一首，最多尝试一圈
      while (attempts < maxAttempts && (!currentPlaylist[nextIndex] || currentPlaylist[nextIndex] === '')) {
        nextIndex = (nextIndex + 1) % currentPlaylist.length
        attempts++
      }
      
      // 如果所有歌曲都无效，停止播放
      if (attempts >= maxAttempts) {
        wx.showToast({
          title: '没有可播放的歌曲',
          icon: 'none'
        })
        this.setData({ isPlaying: false })
        return
      }
      
      this.setData({ currentIndex: nextIndex }, () => {
        this.playCurrentMusic()
      })
    })

    this.innerAudioContext.onTimeUpdate(() => {
      if (!this.innerAudioContext) return
      const current = this.innerAudioContext.currentTime || 0
      const duration = this.innerAudioContext.duration || 0
      const progress = duration ? (current / duration) * 100 : 0
      this.setData({
        currentTime: current,
        duration,
        progress,
        formattedCurrentTime: this.formatTime(current),
        formattedDuration: this.formatTime(duration)
      })
    })

    this.innerAudioContext.onError((err) => {
      console.error('音频播放出错', err)
      console.error('错误详情:', JSON.stringify(err))
      // 确保隐藏loading（配对使用）
      if (this.data.isLoading) {
        wx.hideLoading()
      }
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout)
        this.loadingTimeout = null
      }
      
      // 停止播放状态
      this.setData({ isPlaying: false })
      
      // 错误码说明：
      // 10001: 系统错误
      // 10002: 网络错误
      // 10003: 文件错误
      // 10004: 格式错误
      // 602: 文件不存在或参数错误
      
      let errorMsg = '未知错误'
      let errorCode = err.errCode || err.code || 'UNKNOWN'
      
      if (err.errMsg) {
        errorMsg = err.errMsg
      } else if (err.message) {
        errorMsg = err.message
      }
      
      console.error('音频错误详情:', {
        errCode: errorCode,
        errMsg: errorMsg,
        fullError: err
      })
      
      // 如果是可恢复的错误，尝试重新初始化
      if (errorCode === 10001 || errorCode === 10002 || errorCode === 602 || 
          (err.errMsg && (err.errMsg.includes('audioInstance is not set') || err.errMsg.includes('not found') || err.errMsg.includes('param')))) {
        console.log('检测到可恢复错误，尝试重新初始化音频上下文')
        this.initAudioContext()
        // 延迟后重试播放
        setTimeout(() => {
          this.playCurrentMusic()
        }, 1000)
        return
      }
      
      // 构建详细的错误信息
      let errorContent = `错误代码：${errorCode}\n错误信息：${errorMsg}`
      
      // 根据错误码提供针对性建议
      if (errorCode === 602 || errorMsg.includes('not found') || errorMsg.includes('不存在') || errorMsg.includes('param')) {
        errorContent += '\n\n可能原因：\n1. 音频文件不存在或路径错误\n2. 云存储文件未正确上传\n3. 文件权限设置问题\n4. 参数传递错误'
      } else if (errorCode === 10003) {
        errorContent += '\n\n可能原因：\n1. 音频文件格式不支持\n2. 文件已损坏'
      } else if (errorCode === 10002) {
        errorContent += '\n\n可能原因：\n1. 网络连接不稳定\n2. 请检查网络设置'
      }
      
      errorContent += '\n\n请检查：\n1. 网络连接是否正常\n2. 音频文件是否存在\n3. 设备音量是否开启\n4. 是否开启了静音模式'
      
      this.setData({ isLoading: false })
      
      wx.showModal({
        title: '音频播放失败',
        content: errorContent,
        showCancel: false,
        confirmText: '我知道了'
      })
    })

    this.innerAudioContext.onWaiting(() => {
      console.log('音频加载中...')
      if (!this.data.isLoading) {
        this.setData({ isLoading: true })
        // 先隐藏可能存在的loading，再显示新的
        wx.hideLoading()
        wx.showLoading({ title: '加载音频中...', mask: false })
        // 清除之前的超时定时器
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout)
        }
        this.loadingTimeout = setTimeout(() => {
          console.warn('音频加载超时')
          wx.hideLoading()
          this.setData({ isLoading: false })
          this.loadingTimeout = null
        }, 10000)
      }
    })

    // 注意：InnerAudioContext 不支持 onCanPlay 和 onSeeked 事件
    // 使用 onPlay 事件来隐藏加载提示
  },

  // 选择播放指定索引的歌曲
  selectSong(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    if (isNaN(index) || index < 0) {
      console.error('选择歌曲失败：索引无效', index)
      return
    }
    
    const { currentMusicType, playlists } = this.data
    if (!currentMusicType) return
    
    const currentPlaylist = playlists[currentMusicType] || []
    if (!currentPlaylist || index >= currentPlaylist.length || !currentPlaylist[index]) {
      wx.showToast({
        title: '歌曲不存在',
        icon: 'none'
      })
      return
    }
    
    // 如果正在播放，先停止
    if (this.innerAudioContext && this.data.isPlaying) {
      this.innerAudioContext.stop()
    }
    
    // 设置新的索引并播放
    this.setData({ currentIndex: index }, () => {
      this.playCurrentMusic()
    })
  },

  // 播放当前索引对应的音频（支持所有音律）
  playCurrentMusic() {
    const { currentMusicType, currentIndex, playlists } = this.data
    if (!currentMusicType) {
      console.error('未选择音律类型')
      return
    }
    
    const currentPlaylist = playlists[currentMusicType] || []
    
    // 确保音频上下文存在
    const audioContext = this.ensureAudioContext()
    if (!audioContext) {
      console.error('无法创建音频上下文')
      wx.showToast({
        title: '音频初始化失败',
        icon: 'none'
      })
      return
    }

    // 先停止当前播放（如果有）
    try {
      if (audioContext.src) {
        audioContext.stop()
      }
    } catch (e) {
      console.warn('停止音频失败', e)
    }

    // 清除之前的超时定时器
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
      this.loadingTimeout = null
    }

    // 必须使用临时URL，安卓端不支持直接使用云存储File ID
    let src = null
    if (currentPlaylist && currentPlaylist.length > 0 && currentPlaylist[currentIndex] && currentPlaylist[currentIndex] !== '') {
      src = currentPlaylist[currentIndex]
      console.log(`使用临时URL播放${currentMusicType}，索引:`, currentIndex, 'URL:', src)
    } else {
      // 临时URL不可用，无法播放
      console.error('音频临时URL不可用，索引:', currentIndex)
      wx.showModal({
        title: '音频加载失败',
        content: '音频文件无法加载，可能原因：\n1. 云存储文件权限设置问题\n2. 网络连接异常\n3. 文件不存在\n\n请检查云存储文件权限设置，确保文件可公开访问或已正确配置权限。',
        showCancel: false,
        confirmText: '我知道了'
      })
      if (this.data.isLoading) {
        wx.hideLoading()
        this.setData({ isLoading: false })
      }
      return
    }

    if (!src || src.trim() === '') {
      wx.showModal({
        title: '音频地址无效',
        content: '音频文件地址为空，无法播放。请检查云存储文件是否正确上传。',
        showCancel: false,
        confirmText: '我知道了'
      })
      if (this.data.isLoading) {
        wx.hideLoading()
        this.setData({ isLoading: false })
      }
      return
    }

    try {
      // 确保音频上下文有效
      const audioContext = this.ensureAudioContext()
      if (!audioContext) {
        throw new Error('音频上下文无效')
      }

      // 设置音频源
      audioContext.src = src
      // 确保音量设置
      audioContext.volume = 1.0
      // iOS需要设置obeyMuteSwitch为false，允许在静音模式下播放
      audioContext.obeyMuteSwitch = false
      
      console.log('音频设置完成，准备播放')
      console.log('src:', audioContext.src)
      console.log('volume:', audioContext.volume)
      console.log('obeyMuteSwitch:', audioContext.obeyMuteSwitch)
      
      // 延迟一点再播放，确保设置生效
      setTimeout(() => {
        try {
          // 再次检查音频上下文
          if (!this.innerAudioContext) {
            console.error('音频上下文在延迟后丢失')
            this.initAudioContext()
            this.innerAudioContext.src = src
            this.innerAudioContext.volume = 1.0
            this.innerAudioContext.obeyMuteSwitch = false
          }
          
          // 真机调试：再次确认设置
          console.log('播放前最终检查:')
          console.log('- src:', this.innerAudioContext.src)
          console.log('- volume:', this.innerAudioContext.volume)
          console.log('- obeyMuteSwitch:', this.innerAudioContext.obeyMuteSwitch)
          
          // 调用播放
          this.innerAudioContext.play()
          console.log('已调用播放方法')
          
          // 真机调试：播放后检查状态（延迟更长时间，确保状态更新）
          setTimeout(() => {
            if (!this.innerAudioContext) return
            
            console.log('播放后状态检查:')
            console.log('- paused:', this.innerAudioContext.paused)
            console.log('- currentTime:', this.innerAudioContext.currentTime)
            console.log('- duration:', this.innerAudioContext.duration)
            console.log('- isPlaying状态:', this.data.isPlaying)
            
            // 如果播放后仍然暂停且没有触发onPlay，可能是真机限制
            if (this.innerAudioContext.paused && !this.data.isPlaying) {
              console.warn('音频可能未真正播放，尝试重新播放')
              // 重新设置并播放
              this.innerAudioContext.src = src
              this.innerAudioContext.volume = 1.0
              this.innerAudioContext.obeyMuteSwitch = false
              setTimeout(() => {
                this.innerAudioContext.play()
              }, 200)
            } else if (!this.innerAudioContext.paused && this.data.isPlaying) {
              // 如果正在播放但没有声音，可能是音量或设备问题
              console.log('音频正在播放，但可能没有声音')
              console.log('请检查：1. 设备音量 2. 静音开关 3. 音频格式')
            }
          }, 1000)
        } catch (playErr) {
          console.error('调用play()失败:', playErr)
          if (this.data.isLoading) {
            wx.hideLoading()
          }
          this.setData({ isLoading: false })
          // 尝试重新初始化
          this.initAudioContext()
          wx.showToast({
            title: '播放失败，请重试',
            icon: 'none'
          })
        }
      }, 300)
    } catch (err) {
      console.error('播放音频异常:', err)
      wx.hideLoading()
      this.setData({ isLoading: false })
      // 尝试重新初始化音频上下文
      this.initAudioContext()
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none'
      })
    }
  },

  // 播放/暂停切换
  togglePlay() {
    const audioContext = this.ensureAudioContext()
    if (!audioContext) {
      wx.showToast({
        title: '音频未初始化',
        icon: 'none'
      })
      return
    }
    
    if (this.data.isPlaying) {
      try {
        audioContext.pause()
        // isPlaying 会在 onPause 回调中更新
      } catch (err) {
        console.error('暂停失败', err)
        this.initAudioContext()
      }
    } else {
      try {
        // 如果还没有设置音频源，先设置
        const { currentMusicType, currentIndex, playlists } = this.data
        if (!audioContext.src) {
          let src = null
          if (currentMusicType) {
            const currentPlaylist = playlists[currentMusicType] || []
            if (currentPlaylist.length > 0 && currentPlaylist[currentIndex]) {
              src = currentPlaylist[currentIndex]
            }
          }
          if (src) {
            audioContext.src = src
            audioContext.volume = 1.0
            audioContext.obeyMuteSwitch = false
          }
        }
        audioContext.play()
        // isPlaying 会在 onPlay 回调中更新
      } catch (err) {
        console.error('播放失败', err)
        this.initAudioContext()
        wx.showToast({
          title: '播放失败，请重试',
          icon: 'none'
        })
      }
    }
  },

  // 主动结束本次疗愈
  stopTherapy() {
    const { currentMusicType, musicConfig } = this.data
    if (!currentMusicType) return
    const config = musicConfig[currentMusicType]
    this.handleTherapyFinished(currentMusicType, config ? config.name : '五音')
  },

  // 结束音乐疗法后的收尾逻辑
  handleTherapyFinished(type, name) {
    if (this.innerAudioContext) {
      this.innerAudioContext.stop()
    }
    this.setData({ isPlaying: false })

    wx.showToast({
      title: `${name}疗愈完成`,
      icon: 'success'
    })

    this.recordTherapyCompletion(type, name)
  },

  // 记录疗愈完成
  recordTherapyCompletion(type, name) {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`

    let records = wx.getStorageSync('musicTherapyRecords') || []

    records.push({
      type,
      name,
      date: dateStr,
      timestamp: now.getTime()
    })

    wx.setStorageSync('musicTherapyRecords', records)

    // 记录打卡（所有音律都记录）
    const checkin = require('../../utils/checkin.js')
    checkin.recordCheckin('music').then(() => {
      // 显示完成统计，然后提示记录心情
      this.showCompletionStats(() => {
        this.promptEmotionRecord('music')
      })
    }).catch(err => {
      console.error('记录打卡失败', err)
      this.showCompletionStats(() => {
        this.promptEmotionRecord('music')
      })
    })
  },

  // 显示完成统计
  showCompletionStats(callback) {
    const records = wx.getStorageSync('musicTherapyRecords') || []
    const today = new Date().toDateString()
    const todayRecords = records.filter(record => new Date(record.timestamp).toDateString() === today)
    const totalRecords = records.length

    // 计算本次疗愈时长（如果有播放时长数据）
    const playDuration = this.data.duration || 0
    const minutes = Math.floor(playDuration / 60)

    // 生成激励性提示
    let encouragement = ''
    let title = '🎵 疗愈完成！'
    
    if (totalRecords >= 50) {
      encouragement = `太棒了！你已经完成了 ${totalRecords} 次五音疗愈，这是非常了不起的坚持！\n\n今日已完成 ${todayRecords.length} 次，你的身心正在变得越来越健康。音乐的力量正在滋养你的心灵，继续保持这个好习惯！`
    } else if (totalRecords >= 20) {
      encouragement = `很好！你已经完成了 ${totalRecords} 次五音疗愈。\n\n今日已完成 ${todayRecords.length} 次，每一次聆听都是对心灵的滋养。坚持下去，你会感受到更多的平静与和谐。`
    } else if (totalRecords >= 10) {
      encouragement = `不错！你已经完成了 ${totalRecords} 次五音疗愈。\n\n今日已完成 ${todayRecords.length} 次，音乐正在帮助你调节身心。继续这个好习惯，你会收获更多！`
    } else {
      encouragement = `你完成了本次五音疗愈！\n\n今日已完成 ${todayRecords.length} 次，好的开始是成功的一半。音乐疗法需要坚持，每一次聆听都在为你的身心健康加分。继续加油！`
    }

    // 如果有播放时长，添加时长信息
    if (minutes > 0) {
      encouragement += `\n\n本次疗愈时长：约 ${minutes} 分钟`
    }

    wx.showModal({
      title: title,
      content: encouragement,
      showCancel: false,
      confirmText: '继续疗愈',
      confirmColor: '#34D399',
      success: () => {
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
      content: '完成疗愈后，记录一下此刻的心情吧！这有助于更好地了解自己的情绪变化。',
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

  // 进度条拖动中（实时更新，但不跳转）
  onProgressChanging(e) {
    // 拖动中不执行跳转，只更新显示
    const value = e.detail.value
    const duration = this.data.duration || 0
    if (duration > 0) {
      const currentTime = (value / 100) * duration
      this.setData({
        progress: value,
        formattedCurrentTime: this.formatTime(currentTime)
      })
    }
  },

  // 进度条拖动完成（跳转到指定位置）
  onProgressChange(e) {
    const value = e.detail.value
    const duration = this.data.duration || 0
    
    if (!this.innerAudioContext || duration <= 0) {
      return
    }
    
    // 计算目标时间
    const targetTime = (value / 100) * duration
    
    try {
      // 跳转到指定位置
      this.innerAudioContext.seek(targetTime)
      this.setData({
        currentTime: targetTime,
        progress: value,
        formattedCurrentTime: this.formatTime(targetTime)
      })
    } catch (err) {
      console.error('跳转进度失败', err)
      wx.showToast({
        title: '跳转失败',
        icon: 'none',
        duration: 1500
      })
    }
  },

  // 时间格式化 mm:ss
  formatTime(seconds) {
    const sec = Math.floor(seconds || 0)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    const mm = m < 10 ? '0' + m : '' + m
    const ss = s < 10 ? '0' + s : '' + s
    return `${mm}:${ss}`
  }
})
