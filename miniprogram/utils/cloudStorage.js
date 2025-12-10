// 云存储工具函数
// 获取云存储文件的临时访问URL
const getCloudFileURL = (cloudPath) => {
  return new Promise((resolve, reject) => {
    console.log('开始获取云存储文件URL，路径:', cloudPath)
    
    // 验证路径格式
    if (!cloudPath || typeof cloudPath !== 'string') {
      reject(new Error('云存储路径无效: 路径不能为空且必须是字符串'))
      return
    }
    
    // 检查路径是否以 cloud:// 开头
    if (!cloudPath.startsWith('cloud://')) {
      console.warn('警告: 路径不是 cloud:// 格式，可能不是有效的云存储 File ID')
    }
    
    wx.cloud.getTempFileURL({
      fileList: [cloudPath],
      success: res => {
        console.log('getTempFileURL 返回结果:', JSON.stringify(res))
        if (res.fileList && res.fileList.length > 0) {
          const fileItem = res.fileList[0]
          console.log('文件项详情:', JSON.stringify(fileItem))
          
          // 检查是否有错误码（errCode 602 表示文件不存在）
          // errMsg 中包含错误信息（如 STORAGE_EXCEED_AUTHORITY）
          const hasError = fileItem.code || fileItem.status !== 0 || (fileItem.errMsg && fileItem.errMsg !== 'ok')
          
          if (hasError) {
            const errorCode = fileItem.code || fileItem.status || 'UNKNOWN'
            const errorMsg = fileItem.errMsg || '未知错误'
            console.error('获取文件URL失败，错误码:', errorCode, '错误信息:', errorMsg)
            
            // 提供更友好的错误提示
            if (errorCode === 602 || errorCode === 'FILE_NOT_EXIST' || errorMsg.includes('not found')) {
              reject(new Error(`文件不存在: 请检查云存储路径是否正确\n路径: ${cloudPath}\n错误码: ${errorCode}`))
            } else if (errorMsg.includes('STORAGE_EXCEED_AUTHORITY') || errorMsg.includes('权限')) {
              reject(new Error(`权限错误: 请检查云存储文件权限设置\n路径: ${cloudPath}\n错误信息: ${errorMsg}\n\n解决方案：在云开发控制台将文件权限设置为"所有用户可读"`))
            } else {
              reject(new Error(`获取临时URL失败: ${errorMsg}\n错误码: ${errorCode}\n路径: ${cloudPath}`))
            }
            return
          }
          
          if (fileItem.tempFileURL) {
            console.log('成功获取临时URL:', fileItem.tempFileURL)
            resolve(fileItem.tempFileURL)
          } else {
            console.error('tempFileURL 为空，完整返回:', JSON.stringify(fileItem))
            reject(new Error(`获取临时URL失败: tempFileURL 为空\n文件路径: ${cloudPath}\n返回数据: ${JSON.stringify(fileItem)}`))
          }
        } else {
          console.error('文件列表为空，完整返回:', JSON.stringify(res))
          reject(new Error(`文件列表为空\n请求路径: ${cloudPath}`))
        }
      },
      fail: err => {
        console.error('获取云存储文件URL失败:', err)
        const errorMsg = err.errMsg || err.message || '未知错误'
        const errorCode = err.errCode || err.code || 'UNKNOWN'
        reject(new Error(`获取URL失败: ${errorMsg}\n错误码: ${errorCode}\n路径: ${cloudPath}`))
      }
    })
  })
}

// 批量获取云存储文件的临时访问URL
const getCloudFileURLs = (cloudPaths) => {
  return new Promise((resolve, reject) => {
    console.log('开始批量获取云存储文件URL，文件数量:', cloudPaths.length)
    wx.cloud.getTempFileURL({
      fileList: cloudPaths,
      success: res => {
        console.log('getTempFileURL 批量返回结果:', res)
        if (res.fileList && res.fileList.length > 0) {
          const urls = []
          const errors = []
          
          res.fileList.forEach((item, index) => {
          // 检查是否有错误码或状态码
          // status !== 0 表示有错误，code 也可能存在
          // errMsg 中包含错误信息（如 STORAGE_EXCEED_AUTHORITY）
          const hasError = item.code || item.status !== 0 || (item.errMsg && item.errMsg !== 'ok')
          
          if (hasError) {
              const errorCode = item.code || item.status || 'UNKNOWN'
              const errorMsg = item.errMsg || `文件 ${index + 1} 获取失败`
              console.error(`文件 ${index + 1} 获取URL失败:`, errorCode, errorMsg)
              
              // 特殊处理权限错误
              if (errorMsg.includes('STORAGE_EXCEED_AUTHORITY') || errorCode === 'STORAGE_EXCEED_AUTHORITY' || errorMsg.includes('权限')) {
                console.error(`文件 ${index + 1} 权限错误: 请检查云存储文件权限设置，建议设置为"所有用户可读"`)
              }
              
              errors.push({
                index: index,
                path: cloudPaths[index],
                code: errorCode,
                errMsg: errorMsg
              })
              urls.push(null)
            } else if (item.tempFileURL) {
              console.log(`文件 ${index + 1} 获取URL成功:`, item.tempFileURL)
              urls.push(item.tempFileURL)
            } else {
              console.error(`文件 ${index + 1} tempFileURL 为空:`, JSON.stringify(item))
              errors.push({
                index: index,
                path: cloudPaths[index],
                code: 'EMPTY_URL',
                errMsg: 'tempFileURL 为空'
              })
              urls.push(null)
            }
          })
          
          // 如果有错误，记录但不阻止返回（返回部分成功的URL）
          if (errors.length > 0) {
            console.warn('部分文件获取URL失败:', errors)
            
            // 检查是否有权限错误
            const permissionErrors = errors.filter(e => 
              e.errMsg && (e.errMsg.includes('STORAGE_EXCEED_AUTHORITY') || e.errMsg.includes('权限'))
            )
            
            if (permissionErrors.length > 0) {
              console.error(`发现 ${permissionErrors.length} 个权限错误，请检查云存储文件权限设置`)
            }
          }
          
          resolve(urls)
        } else {
          console.error('文件列表为空，完整返回:', JSON.stringify(res))
          reject(new Error('文件列表为空'))
        }
      },
      fail: err => {
        console.error('批量获取云存储文件URL失败:', err)
        // 提供更详细的错误信息
        const errorMsg = err.errMsg || err.message || '未知错误'
        const errorCode = err.errCode || err.code || 'UNKNOWN'
        reject(new Error(`批量获取URL失败: ${errorMsg} (错误码: ${errorCode})`))
      }
    })
  })
}

module.exports = {
  getCloudFileURL,
  getCloudFileURLs
}

