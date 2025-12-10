// 登录状态管理工具函数
const app = getApp()

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
  return !!(app.globalData.openid && app.globalData.userInfo)
}

/**
 * 获取当前用户的 openid
 * @returns {string|null} openid 或 null
 */
function getOpenid() {
  return app.globalData.openid || null
}

/**
 * 清除所有用户相关的本地缓存数据
 */
function clearUserData() {
  // 清除登录信息
  app.globalData.userInfo = null
  app.globalData.openid = null
  wx.removeStorageSync('userInfo')
  wx.removeStorageSync('openid')
  
  // 清除其他可能存在的用户相关缓存
  // 注意：这里只清除本地缓存，云数据库中的数据不会删除
  // 因为云数据库中的数据是通过 _openid 关联的，切换用户后自然只能看到新用户的数据
  
  // 可以清除一些本地存储的临时数据（如果有的话）
  // wx.removeStorageSync('musicTherapyRecords') // 如果不需要保留历史记录
}

/**
 * 设置登录状态
 * @param {string} openid - 用户 openid
 * @param {object} userInfo - 用户信息
 */
function setLoginState(openid, userInfo) {
  app.globalData.openid = openid
  app.globalData.userInfo = userInfo
  wx.setStorageSync('openid', openid)
  wx.setStorageSync('userInfo', userInfo)
}

/**
 * 初始化登录状态（从本地缓存恢复）
 */
function initLoginState() {
  const cachedUser = wx.getStorageSync('userInfo')
  const cachedOpenid = wx.getStorageSync('openid')
  
  if (cachedUser && cachedOpenid) {
    app.globalData.userInfo = cachedUser
    app.globalData.openid = cachedOpenid
    return true
  }
  
  return false
}

module.exports = {
  isLoggedIn,
  getOpenid,
  clearUserData,
  setLoginState,
  initLoginState
}

