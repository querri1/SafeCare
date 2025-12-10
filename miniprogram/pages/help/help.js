// 帮助与反馈页面
Page({
  data: {
    faqList: [
      {
        question: '如何开始使用？',
        answer: '首次使用需要先登录，登录后即可开始使用各种功能。在治愈中心可以选择健身操练习（标准八段锦或趣味健身操分类，包括消气操、自在肩颈操、本草纲目、暴汗燃脂操）、五音疗法或心理健康测试。'
      },
      {
        question: '打卡规则是什么？',
        answer: '只要完成了今日治愈的任意一个项目（健身操、五音疗法或心理健康测试），就算成功打卡。每天只能打卡一次。'
      },
      {
        question: '心理健康测试多久做一次？',
        answer: '建议每周进行1-2次心理健康测试，系统会限制每周最多测试2次，以确保测试结果的准确性。'
      },
      {
        question: '数据会保存多久？',
        answer: '您的所有数据都会保存在云端，只要您不主动删除，数据会一直保存。'
      },
      {
        question: '如何提交反馈？',
        answer: '您可以通过发送邮件至 safe_care_support@163.com 联系我们，我们会尽快回复您的问题。'
      }
    ],
    expandedIndex: -1
  },

  onLoad() {
    // 页面加载
  },

  // 展开/收起FAQ
  toggleFaq(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      expandedIndex: this.data.expandedIndex === index ? -1 : index
    })
  },

  // 提交反馈
  submitFeedback() {
    wx.showModal({
      title: '提交反馈',
      content: '您可以通过以下方式联系我们：\n\n发送邮件至：safe_care_support@163.com\n\n我们会认真处理您的每一条反馈。',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})

