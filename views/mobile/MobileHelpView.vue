<template>
  <div class="mobile-help">
    <div class="help-header">
      <div class="header-back" @click="goBack">
        <span>←</span>
      </div>
      <h2>帮助中心</h2>
      <div class="header-search" @click="showSearch = true">
        <span>🔍</span>
      </div>
    </div>

    <div class="help-content">
      <!-- 搜索框 -->
      <div class="search-section" v-if="!showSearch">
        <el-input
          v-model="searchQuery"
          placeholder="搜索帮助内容..."
          clearable
          @clear="clearSearch"
          @keyup.enter="searchHelp"
        >
          <template #prefix>
            <span>🔍</span>
          </template>
          <template #suffix>
            <el-button 
              type="primary" 
              @click="searchHelp"
              size="small"
              circle
            >
              <span>🔍</span>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 热门问题 -->
      <div class="hot-questions" v-if="!searchQuery">
        <div class="section-header">
          <h3>热门问题</h3>
          <el-button type="text" @click="refreshHotQuestions">
            <span>🔄</span>
            换一批
          </el-button>
        </div>
        <div class="hot-list">
          <div 
            v-for="(question, index) in hotQuestions" 
            :key="question.id"
            class="hot-item"
            @click="viewQuestion(question)"
          >
            <div class="hot-rank">
              <span :class="`rank-${index + 1}`">{{ index + 1 }}</span>
            </div>
            <div class="hot-content">
              <div class="hot-title">{{ question.title }}</div>
              <div class="hot-meta">
                <span class="hot-views">{{ question.views }}人看过</span>
                <el-tag v-if="question.isNew" size="small" type="danger">新</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 问题分类 -->
      <div class="help-categories">
        <div class="section-header">
          <h3>问题分类</h3>
        </div>
        <div class="category-grid">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-card"
            @click="viewCategory(category)"
          >
            <div class="category-icon">
              <span style="font-size: 32px;" :style="{ color: category.color }">📁</span>
            </div>
            <div class="category-info">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-count">{{ category.count }}个问题</div>
            </div>
            <div class="category-arrow">
              <span>→</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷服务 -->
      <div class="quick-services">
        <div class="section-header">
          <h3>快捷服务</h3>
        </div>
        <div class="service-grid">
          <div 
            v-for="service in quickServices" 
            :key="service.id"
            class="service-card"
            @click="handleService(service)"
          >
            <div class="service-icon">
              <span style="font-size: 24px;" :style="{ color: service.color }">🛠️</span>
            </div>
            <div class="service-name">{{ service.name }}</div>
            <div class="service-desc">{{ service.description }}</div>
          </div>
        </div>
      </div>

      <!-- 常见问题列表 -->
      <div class="faq-list" v-if="searchQuery">
        <div class="section-header">
          <h3>搜索结果 ({{ filteredFAQs.length }})</h3>
          <el-button type="text" @click="clearSearch">
            清除搜索
          </el-button>
        </div>
        <div class="faq-items">
          <div 
            v-for="faq in filteredFAQs" 
            :key="faq.id"
            class="faq-item"
            @click="viewFAQ(faq)"
          >
            <div class="faq-question">
              <span>❓</span>
              <span>{{ faq.question }}</span>
            </div>
            <div class="faq-answer">{{ faq.answer }}</div>
            <div class="faq-meta">
              <span class="faq-category">{{ faq.category }}</span>
              <span class="faq-helpful">
                <span>👍</span>
                {{ faq.helpful }}人觉得有用
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类详情 -->
      <div class="category-detail" v-if="currentCategory">
        <div class="section-header">
          <h3>{{ currentCategory.name }}</h3>
          <el-button type="text" @click="backToCategories">
            <span>←</span>
            返回分类
          </el-button>
        </div>
        <div class="category-questions">
          <div 
            v-for="question in currentCategory.questions" 
            :key="question.id"
            class="category-question"
            @click="viewQuestion(question)"
          >
            <div class="question-title">{{ question.title }}</div>
            <div class="question-meta">
              <span class="question-views">{{ question.views }}人看过</span>
              <el-tag v-if="question.isResolved" size="small" type="success">已解决</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 问题详情对话框 -->
    <el-dialog
      v-model="showQuestion"
      :title="currentQuestion?.title"
      width="90%"
      top="10vh"
      class="question-dialog"
    >
      <div class="question-content" v-if="currentQuestion">
        <div class="question-header">
          <div class="question-meta">
            <span class="question-category">{{ currentQuestion.category }}</span>
            <span class="question-time">{{ currentQuestion.createTime }}</span>
            <span class="question-views">{{ currentQuestion.views }}人看过</span>
          </div>
        </div>
        
        <div class="question-body">
          <div class="question-description">
            <h4>问题描述</h4>
            <p>{{ currentQuestion.description }}</p>
          </div>
          
          <div class="question-solution">
            <h4>解决方案</h4>
            <div v-html="currentQuestion.solution"></div>
          </div>
          
          <div class="question-related" v-if="currentQuestion.relatedQuestions.length > 0">
            <h4>相关问题</h4>
            <div class="related-list">
              <div 
                v-for="related in currentQuestion.relatedQuestions" 
                :key="related.id"
                class="related-item"
                @click="viewQuestion(related)"
              >
                {{ related.title }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="question-footer">
          <div class="helpful-section">
            <p>这个答案对您有帮助吗？</p>
            <div class="helpful-buttons">
              <el-button 
                :type="helpfulFeedback === 'yes' ? 'success' : 'default'"
                @click="markHelpful('yes')"
                size="small"
              >
                <el-icon><SuccessFilled /></el-icon>
                有帮助
              </el-button>
              <el-button 
                :type="helpfulFeedback === 'no' ? 'danger' : 'default'"
                @click="markHelpful('no')"
                size="small"
              >
                <el-icon><CircleClose /></el-icon>
                没帮助
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showQuestion = false">关闭</el-button>
          <el-button type="primary" @click="contactSupport">
            <el-icon><ChatDotRound /></el-icon>
            联系客服
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 联系客服对话框 -->
    <el-dialog
      v-model="showContact"
      title="联系客服"
      width="90%"
      top="20vh"
      class="contact-dialog"
    >
      <div class="contact-content">
        <div class="contact-info">
          <div class="contact-item">
            <span>📞</span>
            <div class="contact-details">
              <div class="contact-label">客服热线</div>
              <div class="contact-value">400-888-8888</div>
              <div class="contact-time">工作时间：9:00-18:00</div>
            </div>
            <el-button type="primary" size="small" @click="makeCall">
              <el-icon><Phone /></el-icon>
              拨打
            </el-button>
          </div>
          
          <div class="contact-item">
            <span>💬</span>
            <div class="contact-details">
              <div class="contact-label">在线客服</div>
              <div class="contact-value">24小时在线服务</div>
              <div class="contact-time">平均响应时间：2分钟</div>
            </div>
            <el-button type="success" size="small" @click="startChat">
              <el-icon><ChatDotRound /></el-icon>
              开始对话
            </el-button>
          </div>
          
          <div class="contact-item">
            <span>📧</span>
            <div class="contact-details">
              <div class="contact-label">邮件反馈</div>
              <div class="contact-value">support@parking.com</div>
              <div class="contact-time">24小时内回复</div>
            </div>
            <el-button type="info" size="small" @click="sendEmail">
              <el-icon><MessageBox /></el-icon>
              发送邮件
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showContact = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MobileHelpView',
  data() {
    return {
      searchQuery: '',
      showSearch: false,
      showQuestion: false,
      showContact: false,
      currentCategory: null,
      currentQuestion: null,
      helpfulFeedback: null,
      hotQuestions: [
        {
          id: 1,
          title: '如何预约停车位？',
          views: 1250,
          isNew: true,
          category: '预约相关'
        },
        {
          id: 2,
          title: '停车费用如何计算？',
          views: 980,
          isNew: false,
          category: '费用相关'
        },
        {
          id: 3,
          title: '忘记密码怎么办？',
          views: 756,
          isNew: false,
          category: '账户相关'
        },
        {
          id: 4,
          title: '如何开具发票？',
          views: 623,
          isNew: true,
          category: '发票相关'
        },
        {
          id: 5,
          title: '预约后如何取消？',
          views: 445,
          isNew: false,
          category: '预约相关'
        }
      ],
      categories: [
        {
          id: 1,
          name: '账户相关',
          icon: 'User',
          color: '#409eff',
          count: 15,
          questions: [
            { id: 1, title: '如何注册账户？', views: 234, isResolved: true },
            { id: 2, title: '忘记密码怎么办？', views: 567, isResolved: true },
            { id: 3, title: '如何修改个人信息？', views: 123, isResolved: true }
          ]
        },
        {
          id: 2,
          name: '预约相关',
          icon: 'Calendar',
          color: '#67c23a',
          count: 12,
          questions: [
            { id: 1, title: '如何预约停车位？', views: 890, isResolved: true },
            { id: 2, title: '预约后如何取消？', views: 445, isResolved: true },
            { id: 3, title: '预约时间可以修改吗？', views: 334, isResolved: true }
          ]
        },
        {
          id: 3,
          name: '费用相关',
          icon: 'Money',
          color: '#e6a23c',
          count: 18,
          questions: [
            { id: 1, title: '停车费用如何计算？', views: 1200, isResolved: true },
            { id: 2, title: '如何充值余额？', views: 678, isResolved: true },
            { id: 3, title: '余额可以提现吗？', views: 234, isResolved: true }
          ]
        },
        {
          id: 4,
          name: '发票相关',
          icon: 'Document',
          color: '#f56c6c',
          count: 8,
          questions: [
            { id: 1, title: '如何开具发票？', views: 567, isResolved: true },
            { id: 2, title: '发票可以邮寄吗？', views: 234, isResolved: true },
            { id: 3, title: '发票抬头可以修改吗？', views: 123, isResolved: true }
          ]
        },
        {
          id: 5,
          name: '技术问题',
          icon: 'Tools',
          color: '#909399',
          count: 22,
          questions: [
            { id: 1, title: 'APP无法打开怎么办？', views: 345, isResolved: true },
            { id: 2, title: '定位不准确怎么解决？', views: 234, isResolved: true },
            { id: 3, title: '支付失败如何处理？', views: 456, isResolved: true }
          ]
        },
        {
          id: 6,
          name: '其他问题',
          icon: 'Help',
          color: '#606266',
          count: 5,
          questions: [
            { id: 1, title: '如何联系客服？', views: 789, isResolved: true },
            { id: 2, title: '投诉建议如何提交？', views: 234, isResolved: true }
          ]
        }
      ],
      quickServices: [
        {
          id: 1,
          name: '在线客服',
          description: '24小时在线服务',
          icon: 'ChatDotRound',
          color: '#409eff',
          action: 'contact'
        },
        {
          id: 2,
          name: '意见反馈',
          description: '提交您的建议',
          icon: 'Message',
          color: '#67c23a',
          action: 'feedback'
        },
        {
          id: 3,
          name: '使用指南',
          description: '详细使用教程',
          icon: 'Document',
          color: '#e6a23c',
          action: 'guide'
        },
        {
          id: 4,
          name: '常见问题',
          description: '快速解答',
          icon: 'QuestionFilled',
          color: '#f56c6c',
          action: 'faq'
        }
      ],
      faqs: [
        {
          id: 1,
          question: '如何预约停车位？',
          answer: '在首页选择目标停车场，选择预约时间和车位，确认预约信息并支付预约费用即可。',
          category: '预约相关',
          helpful: 89
        },
        {
          id: 2,
          question: '停车费用如何计算？',
          answer: '停车费用按照停车时长计费，不同停车场收费标准不同，具体费用可在预约时查看。',
          category: '费用相关',
          helpful: 67
        },
        {
          id: 3,
          question: '忘记密码怎么办？',
          answer: '在登录页面点击"忘记密码"，输入注册手机号，通过短信验证码重置密码。',
          category: '账户相关',
          helpful: 45
        },
        {
          id: 4,
          question: '如何开具发票？',
          answer: '在停车记录中选择需要开具发票的记录，点击"开具发票"按钮，填写发票信息即可。',
          category: '发票相关',
          helpful: 34
        }
      ]
    }
  },
  computed: {
    filteredFAQs() {
      if (!this.searchQuery) return []
      return this.faqs.filter(faq =>
        faq.question.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    }
  },
  methods: {
    goBack() {
      this.$router.back()
    },

    searchHelp() {
      if (!this.searchQuery.trim()) {
        this.$message.warning('请输入搜索关键词')
        return
      }
      this.$message.success(`搜索"${this.searchQuery}"的结果`)
    },

    clearSearch() {
      this.searchQuery = ''
    },

    refreshHotQuestions() {
      // 模拟刷新热门问题
      this.$message.success('已更新热门问题')
      this.hotQuestions = this.hotQuestions.sort(() => Math.random() - 0.5)
    },

    viewCategory(category) {
      this.currentCategory = category
    },

    backToCategories() {
      this.currentCategory = null
    },

    viewQuestion(question) {
      // 模拟获取问题详情
      this.currentQuestion = {
        ...question,
        description: '用户在使用停车预约功能时遇到问题，无法正常预约停车位。',
        solution: `
          <p><strong>解决方案：</strong></p>
          <ol>
            <li>检查网络连接是否正常</li>
            <li>确认账户余额是否充足</li>
            <li>检查预约时间是否在有效范围内</li>
            <li>清除APP缓存后重试</li>
          </ol>
          <p><strong>详细步骤：</strong></p>
          <p>1. 打开APP，进入首页</p>
          <p>2. 选择目标停车场</p>
          <p>3. 选择合适的预约时间</p>
          <p>4. 选择车位类型和数量</p>
          <p>5. 确认预约信息并支付</p>
        `,
        createTime: '2024-01-15',
        relatedQuestions: [
          { id: 1, title: '预约后可以取消吗？' },
          { id: 2, title: '预约费用如何退还？' },
          { id: 3, title: '预约时间可以修改吗？' }
        ]
      }
      this.showQuestion = true
    },

    viewFAQ(faq) {
      this.viewQuestion({
        ...faq,
        title: faq.question,
        views: faq.helpful * 2
      })
    },

    markHelpful(type) {
      this.helpfulFeedback = type
      if (type === 'yes') {
        this.$message.success('感谢您的反馈！')
      } else {
        this.$message.info('我们会持续改进服务质量')
      }
    },

    contactSupport() {
      this.showQuestion = false
      this.showContact = true
    },

    handleService(service) {
      switch (service.action) {
        case 'contact':
          this.showContact = true
          break
        case 'feedback':
          this.$message.info('意见反馈功能开发中...')
          break
        case 'guide':
          this.$message.info('使用指南功能开发中...')
          break
        case 'faq':
          this.$message.info('常见问题功能开发中...')
          break
        default:
          this.$message.info('功能开发中...')
      }
    },

    makeCall() {
      window.location.href = 'tel:400-888-8888'
    },

    startChat() {
      this.$message.info('在线客服功能开发中...')
    },

    sendEmail() {
      window.location.href = 'mailto:support@parking.com'
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-help {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.help-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-back {
    margin-right: 15px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
    
    &:hover {
      color: #409eff;
    }
  }

  h2 {
    flex: 1;
    text-align: center;
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }

  .header-search {
    margin-left: 15px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
    
    &:hover {
      color: #409eff;
    }
  }
}

.help-content {
  padding: 20px;
}

.search-section {
  margin-bottom: 20px;
  
  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 25px;
      padding: 0 15px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    .el-input__prefix {
      color: #999;
    }
    
    .el-input__suffix {
      right: 5px;
    }
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  h3 {
    margin: 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
  }
  
  .el-button {
    padding: 0;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}

.hot-questions {
  margin-bottom: 25px;
  
  .hot-list {
    background: white;
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .hot-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }
    
    &:hover {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 12px 10px;
      margin: 0 -10px;
    }
    
    .hot-rank {
      margin-right: 15px;
      
      span {
        display: inline-block;
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        border-radius: 50%;
        font-weight: bold;
        font-size: 12px;
        
        &.rank-1 {
          background: #ff6b6b;
          color: white;
        }
        
        &.rank-2 {
          background: #ffa726;
          color: white;
        }
        
        &.rank-3 {
          background: #ffca28;
          color: white;
        }
        
        &:not(.rank-1):not(.rank-2):not(.rank-3) {
          background: #e0e0e0;
          color: #666;
        }
      }
    }
    
    .hot-content {
      flex: 1;
      
      .hot-title {
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
        line-height: 1.4;
      }
      
      .hot-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .hot-views {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}

.help-categories {
  margin-bottom: 25px;
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .category-card {
    background: white;
    border-radius: 15px;
    padding: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
    
    .category-icon {
      margin-right: 15px;
    }
    
    .category-info {
      flex: 1;
      
      .category-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      
      .category-count {
        font-size: 12px;
        color: #999;
      }
    }
    
    .category-arrow {
      color: #ccc;
    }
  }
}

.quick-services {
  margin-bottom: 25px;
  
  .service-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .service-card {
    background: white;
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
    
    .service-icon {
      margin-bottom: 10px;
    }
    
    .service-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    
    .service-desc {
      font-size: 12px;
      color: #999;
    }
  }
}

.faq-list {
  .faq-items {
    background: white;
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .faq-item {
    padding: 15px 0;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }
    
    &:hover {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 15px 10px;
      margin: 0 -10px;
    }
    
    .faq-question {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .el-icon {
        margin-right: 8px;
        color: #409eff;
      }
      
      span {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }
    }
    
    .faq-answer {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
      margin-bottom: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      box-orient: vertical;
    }
    
    .faq-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .faq-category {
        font-size: 12px;
        color: #999;
        background: #f0f0f0;
        padding: 2px 8px;
        border-radius: 10px;
      }
      
      .faq-helpful {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #67c23a;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
}

.category-detail {
  .category-questions {
    background: white;
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .category-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }
    
    &:hover {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 15px 10px;
      margin: 0 -10px;
    }
    
    .question-title {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
    
    .question-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .question-views {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.question-dialog {
  :deep(.el-dialog) {
    border-radius: 15px;
  }
  
  .question-content {
    .question-header {
      margin-bottom: 20px;
      
      .question-meta {
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: #999;
        
        .question-category {
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 10px;
        }
      }
    }
    
    .question-body {
      .question-description,
      .question-solution,
      .question-related {
        margin-bottom: 20px;
        
        h4 {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        p, div {
          font-size: 14px;
          line-height: 1.6;
          color: #666;
        }
        
        ol {
          padding-left: 20px;
          
          li {
            margin-bottom: 8px;
            color: #666;
            line-height: 1.6;
          }
        }
      }
      
      .question-related {
        .related-list {
          .related-item {
            padding: 8px 0;
            color: #409eff;
            cursor: pointer;
            font-size: 14px;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
    
    .question-footer {
      border-top: 1px solid #e4e7ed;
      padding-top: 20px;
      
      .helpful-section {
        text-align: center;
        
        p {
          font-size: 14px;
          color: #666;
          margin-bottom: 15px;
        }
        
        .helpful-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          
          .el-button {
            min-width: 80px;
          }
        }
      }
    }
  }
}

.contact-dialog {
  :deep(.el-dialog) {
    border-radius: 15px;
  }
  
  .contact-content {
    .contact-info {
      .contact-item {
        display: flex;
        align-items: center;
        padding: 20px 0;
        
        &:not(:last-child) {
          border-bottom: 1px solid #f0f0f0;
        }
        
        .el-icon {
          font-size: 24px;
          margin-right: 15px;
          color: #409eff;
        }
        
        .contact-details {
          flex: 1;
          
          .contact-label {
            font-size: 16px;
            color: #333;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .contact-value {
            font-size: 14px;
            color: #666;
            margin-bottom: 2px;
          }
          
          .contact-time {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .help-content {
    padding: 15px;
  }
  
  .category-grid,
  .service-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .question-dialog .question-footer .helpful-buttons {
    flex-direction: column;
    align-items: center;
  }
}

@media screen and (max-width: 375px) {
  .help-header {
    padding: 12px 15px;
    
    h2 {
      font-size: 16px;
    }
  }
  
  .help-content {
    padding: 12px;
  }
  
  .contact-dialog .contact-content .contact-info .contact-item {
    flex-direction: column;
    text-align: center;
    
    .el-icon {
      margin-right: 0;
      margin-bottom: 10px;
    }
    
    .contact-details {
      margin-bottom: 15px;
    }
  }
}
</style>