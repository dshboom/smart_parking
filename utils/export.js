/**
 * 数据导出工具类
 * 支持Excel和PDF格式导出
 */

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 导出数据到Excel
 * @param {Array} data - 要导出的数据数组
 * @param {string} filename - 文件名（不包含扩展名）
 * @param {Object} options - 导出选项
 */
export function exportToExcel(data, filename = 'export', options = {}) {
  try {
    const {
      sheetName = 'Sheet1',
      headers = null,
      columnWidths = null,
      autoWidth = true
    } = options

    // 准备数据
    let exportData = data
    
    // 如果有自定义表头，重组数据
    if (headers) {
      exportData = [
        headers.map(h => h.title || h),
        ...data.map(row => 
          headers.map(header => {
            const key = header.key || header
            return row[key] || ''
          })
        )
      ]
    }

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(exportData)
    
    // 设置列宽
    if (columnWidths) {
      worksheet['!cols'] = columnWidths.map(width => ({ width }))
    } else if (autoWidth && headers) {
      // 自动计算列宽
      worksheet['!cols'] = headers.map((header, index) => {
        const columnData = exportData.map(row => String(row[index] || ''))
        const maxLength = Math.max(...columnData.map(val => val.length))
        return { width: Math.min(maxLength + 2, 50) }
      })
    }

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 保存文件
    saveAs(blob, `${filename}.xlsx`)
    
    return { success: true, message: 'Excel导出成功' }
  } catch (error) {
    console.error('Excel导出失败:', error)
    return { success: false, message: `Excel导出失败: ${error.message}` }
  }
}

/**
 * 导出数据到PDF
 * @param {HTMLElement} element - 要导出的DOM元素
 * @param {string} filename - 文件名（不包含扩展名）
 * @param {Object} options - 导出选项
 */
export async function exportToPDF(element, filename = 'export', options = {}) {
  try {
    const {
      orientation = 'p',
      unit = 'mm',
      format = 'a4',
      quality = 2,
      scale = 2,
      useCanvas = true
    } = options

    if (useCanvas) {
      // 使用html2canvas生成图片
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png', quality)
      const pdf = new jsPDF(orientation, unit, format)
      
      // 计算图片尺寸
      const imgWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 0
      
      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
      
      // 如果内容超过一页，添加更多页
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }
      
      // 保存PDF
      pdf.save(`${filename}.pdf`)
    } else {
      // 直接生成PDF（适用于简单文本）
      const pdf = new jsPDF(orientation, unit, format)
      
      // 获取文本内容
      const text = element.textContent || element.innerText || ''
      
      // 添加文本到PDF
      pdf.text(text, 10, 10)
      
      // 保存PDF
      pdf.save(`${filename}.pdf`)
    }
    
    return { success: true, message: 'PDF导出成功' }
  } catch (error) {
    console.error('PDF导出失败:', error)
    return { success: false, message: `PDF导出失败: ${error.message}` }
  }
}

/**
 * 导出表格数据到Excel
 * @param {HTMLElement} tableElement - 表格DOM元素
 * @param {string} filename - 文件名
 */
export function exportTableToExcel(tableElement, filename = 'table_export') {
  try {
    // 克隆表格元素以避免修改原始表格
    const clonedTable = tableElement.cloneNode(true)
    
    // 移除不需要的行（如操作列）
    const rows = clonedTable.querySelectorAll('tr')
    rows.forEach(row => {
      const actionCells = row.querySelectorAll('.action-column, .el-table__cell:last-child')
      actionCells.forEach(cell => cell.remove())
    })
    
    // 创建工作簿
    const workbook = XLSX.utils.table_to_book(clonedTable, { sheet: 'Sheet1' })
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 保存文件
    saveAs(blob, `${filename}.xlsx`)
    
    return { success: true, message: '表格导出成功' }
  } catch (error) {
    console.error('表格导出失败:', error)
    return { success: false, message: `表格导出失败: ${error.message}` }
  }
}

/**
 * 准备导出数据（格式化数据）
 * @param {Array} data - 原始数据
 * @param {Object} fieldMap - 字段映射配置
 * @returns {Array} 格式化后的数据
 */
export function prepareExportData(data, fieldMap) {
  return data.map(item => {
    const formattedItem = {}
    
    Object.keys(fieldMap).forEach(key => {
      const config = fieldMap[key]
      let value = item[key]
      
      // 处理嵌套属性
      if (config.path) {
        value = config.path.split('.').reduce((obj, prop) => obj?.[prop], item)
      }
      
      // 格式化值
      if (config.formatter && typeof config.formatter === 'function') {
        value = config.formatter(value, item)
      }
      
      // 处理枚举值
      if (config.enum && config.enum[value]) {
        value = config.enum[value]
      }
      
      formattedItem[config.title || key] = value || ''
    })
    
    return formattedItem
  })
}

/**
 * 批量导出数据
 * @param {Array} datasets - 数据集数组
 * @param {string} filename - 文件名
 * @param {Object} options - 导出选项
 */
export function batchExportToExcel(datasets, filename = 'batch_export', options = {}) {
  try {
    const workbook = XLSX.utils.book_new()
    
    datasets.forEach((dataset, index) => {
      const { data, headers, sheetName = `Sheet${index + 1}` } = dataset
      
      // 准备数据
      let exportData = data
      if (headers) {
        exportData = [
          headers.map(h => h.title || h),
          ...data.map(row => 
            headers.map(header => {
              const key = header.key || header
              return row[key] || ''
            })
          )
        ]
      }
      
      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(exportData)
      
      // 设置列宽
      if (headers && options.autoWidth !== false) {
        worksheet['!cols'] = headers.map((header, idx) => {
          const columnData = exportData.map(row => String(row[idx] || ''))
          const maxLength = Math.max(...columnData.map(val => val.length))
          return { width: Math.min(maxLength + 2, 50) }
        })
      }
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 保存文件
    saveAs(blob, `${filename}.xlsx`)
    
    return { success: true, message: '批量导出成功' }
  } catch (error) {
    console.error('批量导出失败:', error)
    return { success: false, message: `批量导出失败: ${error.message}` }
  }
}