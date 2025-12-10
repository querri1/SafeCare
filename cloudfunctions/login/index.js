const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-4ghau10w942b2505'
})

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    
    // 检查是否成功获取到上下文
    if (!wxContext || !wxContext.OPENID) {
      console.error('无法获取用户 openid')
      return {
        errCode: -1,
        errMsg: '无法获取用户 openid',
        openid: null
      }
    }

    return {
      errCode: 0,
      errMsg: 'success',
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID || null
    }
  } catch (err) {
    console.error('云函数 login 执行错误:', err)
    return {
      errCode: -1,
      errMsg: err.message || '云函数执行失败',
      openid: null
    }
  }
}