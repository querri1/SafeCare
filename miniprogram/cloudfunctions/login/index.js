const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-4ghau10w942b2505'
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID || null
  }
}