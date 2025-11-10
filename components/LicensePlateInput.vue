<template>
  <div class="plate-container">
    <div class="plate-input-wrapper" :class="{ 'shake': isInvalid }">
      <!-- 省份简称选择 -->
      <div class="province-section">
        <el-select 
          v-model="plateData.province" 
          placeholder="省份"
          size="large"
          class="province-select"
          @change="onProvinceChange"
        >
          <el-option
            v-for="province in provinces"
            :key="province.code"
            :label="province.name"
            :value="province.code"
          >
            <span style="float: left">{{ province.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ province.code }}</span>
          </el-option>
        </el-select>
      </div>
  
      <!-- 城市代码输入 -->
      <div class="city-section">
        <el-input
          v-model="plateData.city"
          placeholder="城市代码"
          maxlength="1"
          size="large"
          class="city-input"
          @input="onCityInput"
          @keyup.native="handleCityKeyup"
          @focus="showKeyboardFor('city')"
        />
      </div>
  
      <!-- 分隔符 -->
      <div class="separator">•</div>
  
      <!-- 车牌号主体 -->
      <div class="number-section">
        <el-input
          v-model="plateData.number"
          placeholder="车牌号码"
          maxlength="5"
          size="large"
          class="number-input"
          @input="onNumberInput"
          @keyup.native="handleNumberKeyup"
          @focus="showKeyboardFor('number')"
        />
      </div>
  
      <!-- 新能源标识 -->
      <div class="new-energy-section" v-if="showNewEnergy">
        <el-select 
          v-model="plateData.newEnergy" 
          placeholder="新能源"
          size="large"
          class="new-energy-select"
        >
          <el-option label="D" value="D" />
          <el-option label="F" value="F" />
        </el-select>
      </div>
    </div>
  
    <!-- 新能源车牌切换 -->
    <div class="new-energy-toggle">
      <el-checkbox v-model="isNewEnergy" @change="toggleNewEnergy">
        新能源车牌
      </el-checkbox>
    </div>
  
    <!-- 虚拟键盘 -->
    <div class="virtual-keyboard" v-show="showKeyboard">
      <div class="keyboard-section">
        <div class="keyboard-row">
          <el-button
            v-for="char in currentKeyboardChars"
            :key="char"
            size="small"
            @click="insertChar(char)"
            class="keyboard-btn"
          >
            {{ char }}
          </el-button>
        </div>
        <div class="keyboard-actions">
          <el-button size="small" @click="hideKeyboard">关闭</el-button>
          <el-button size="small" type="danger" @click="deleteChar">删除</el-button>
        </div>
      </div>
    </div>
    <!-- 完整车牌号显示 -->
    <div class="full-plate-display">
      <span class="display-label">完整车牌:</span>
      <span class="display-text">{{ fullPlateNumber }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LicensePlateInput',
  props: {
    // Vue 3 v-model 默认使用 modelValue / update:modelValue
    modelValue: {
      type: String,
      default: ''
    },
    // 兼容旧用法：value / input
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入车牌号'
    }
  },
  emits: ['update:modelValue', 'input', 'change', 'enter'],
  data() {
    return {
      plateData: {
        province: '',
        city: '',
        number: '',
        newEnergy: ''
      },
      isNewEnergy: false,
      showKeyboard: false,
      currentInputField: '',
      isInvalid: false,
      provinces: [
        { code: '京', name: '北京' },
        { code: '津', name: '天津' },
        { code: '沪', name: '上海' },
        { code: '渝', name: '重庆' },
        { code: '冀', name: '河北' },
        { code: '豫', name: '河南' },
        { code: '云', name: '云南' },
        { code: '辽', name: '辽宁' },
        { code: '黑', name: '黑龙江' },
        { code: '湘', name: '湖南' },
        { code: '皖', name: '安徽' },
        { code: '鲁', name: '山东' },
        { code: '新', name: '新疆' },
        { code: '苏', name: '江苏' },
        { code: '浙', name: '浙江' },
        { code: '赣', name: '江西' },
        { code: '鄂', name: '湖北' },
        { code: '桂', name: '广西' },
        { code: '甘', name: '甘肃' },
        { code: '晋', name: '山西' },
        { code: '蒙', name: '内蒙古' },
        { code: '陕', name: '陕西' },
        { code: '吉', name: '吉林' },
        { code: '闽', name: '福建' },
        { code: '贵', name: '贵州' },
        { code: '粤', name: '广东' },
        { code: '青', name: '青海' },
        { code: '藏', name: '西藏' },
        { code: '川', name: '四川' },
        { code: '宁', name: '宁夏' },
        { code: '琼', name: '海南' }
      ],
      numberChars: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      letterChars: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    }
  },
  computed: {
    showNewEnergy() {
      return this.isNewEnergy;
    },
    fullPlateNumber() {
      let plate = this.plateData.province + this.plateData.city;
      if (this.plateData.number) {
        plate += '•' + this.plateData.number;
      }
      if (this.isNewEnergy && this.plateData.newEnergy) {
        plate += this.plateData.newEnergy;
      }
      return plate;
    },
    currentKeyboardChars() {
      if (this.currentInputField === 'city') {
        return this.letterChars.slice(0, 12); // 显示部分字母
      } else if (this.currentInputField === 'number') {
        return [...this.numberChars, ...this.letterChars.slice(0, 10)];
      }
      return [];
    }
  },
  watch: {
    fullPlateNumber(newVal) {
      // 同步到父组件的 v-model
      this.$emit('update:modelValue', newVal);
      // 兼容旧事件
      this.$emit('input', newVal);
      this.$emit('change', newVal);
    },
    // 优先监听 modelValue（Vue3 默认）
    modelValue: {
      handler(newVal) {
        if (newVal && newVal !== this.fullPlateNumber) {
          this.parsePlateNumber(newVal);
        }
      },
      immediate: true
    },
    // 兼容旧用法：value
    value: {
      handler(newVal) {
        if (newVal && newVal !== this.fullPlateNumber) {
          this.parsePlateNumber(newVal);
        }
      },
      immediate: true
    }
  },
  methods: {
    onProvinceChange() {
      this.showKeyboardFor('city');
    },
    onCityInput(value) {
      // 只允许输入大写字母
      this.plateData.city = value.toUpperCase().replace(/[^A-Z]/g, '');
      if (this.plateData.city.length === 1) {
        this.showKeyboardFor('number');
      }
    },
    onNumberInput(value) {
      // 只允许输入字母和数字
      this.plateData.number = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    },
    handleCityKeyup(event) {
      if (event.key === 'Enter' && this.plateData.city) {
        this.showKeyboardFor('number');
      }
    },
    handleNumberKeyup(event) {
      if (event.key === 'Enter' && this.plateData.number) {
        this.$emit('enter');
      }
    },
    toggleNewEnergy(value) {
      if (!value) {
        this.plateData.newEnergy = '';
      }
    },
    insertChar(char) {
      if (this.currentInputField === 'city' && !this.plateData.city) {
        this.plateData.city = char;
        this.showKeyboardFor('number');
      } else if (this.currentInputField === 'number') {
        if (this.plateData.number.length < 5) {
          this.plateData.number += char;
        }
      }
    },
    deleteChar() {
      if (this.plateData.number) {
        this.plateData.number = this.plateData.number.slice(0, -1);
      } else if (this.plateData.city) {
        this.plateData.city = '';
        this.showKeyboardFor('city');
      }
    },
    showKeyboardFor(field) {
      this.currentInputField = field;
      this.showKeyboard = true;
    },
    hideKeyboard() {
      this.showKeyboard = false;
      this.currentInputField = '';
    },
    parsePlateNumber(plateNumber) {
      // 解析现有车牌号
      if (!plateNumber) return;
      
      // 移除分隔符
      const cleanPlate = plateNumber.replace(/[•·.]/g, '');
      
      // 提取省份
      const provinceMatch = cleanPlate.match(/^([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼])/);
      if (provinceMatch) {
        this.plateData.province = provinceMatch[1];
        const remaining = cleanPlate.slice(1);
        
        // 提取城市代码
        if (remaining.length > 0) {
          this.plateData.city = remaining[0];
          const numberPart = remaining.slice(1);
          
          // 检查是否为新能源车牌
          if (numberPart.endsWith('D') || numberPart.endsWith('F')) {
            this.isNewEnergy = true;
            this.plateData.newEnergy = numberPart.slice(-1);
            this.plateData.number = numberPart.slice(0, -1).slice(0, 5);
          } else {
            this.plateData.number = numberPart.slice(0, 5);
          }
        }
      }
    },
    focus() {
      if (!this.plateData.province) {
        this.$refs.provinceSelect?.focus();
      } else if (!this.plateData.city) {
        this.$refs.cityInput?.focus();
      } else {
        this.$refs.numberInput?.focus();
      }
    },
    clear() {
      this.plateData = {
        province: '',
        city: '',
        number: '',
        newEnergy: ''
      };
      this.isNewEnergy = false;
      this.hideKeyboard();
    },
    validate() {
      const plateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{5}[DF]?$/;
      if (!plateRegex.test(this.fullPlateNumber.replace(/[•·.]/g, ''))) {
        this.isInvalid = true;
        setTimeout(() => {
          this.isInvalid = false;
        }, 500); // 抖动动画的持续时间
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>
.plate-container {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10px);
  }
}

.plate-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 8px;
  border: 2px solid #ffd700;
  gap: 5px; /* 减小间距 */
}

.province-section,
.city-section,
.number-section,
.new-energy-section {
  flex: 1; /* 平均分配空间 */
  min-width: 0; /* 允许收缩 */
}

.province-select,
.city-input,
.number-input,
.new-energy-select {
  width: 100%;
}

.separator {
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0 5px;
}

.new-energy-toggle {
  margin-bottom: 15px;
}

.virtual-keyboard {
  background: #f0f2f5;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.keyboard-section {
  text-align: center;
}

.keyboard-row {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px;
}

.keyboard-btn {
  min-width: 40px;
  padding: 10px 15px;
  margin: 2px;
}

.keyboard-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.full-plate-display {
  margin-top: 15px;
  padding: 15px;
  background: #ecf5ff;
  border-radius: 8px;
  border: 1px solid #b3d8ff;
  text-align: center;
}

.display-label {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
  margin-right: 10px;
}

.display-text {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  font-family: 'Courier New', monospace;
}

/* Element UI 样式覆盖 */
:deep(.el-input__inner) {
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  font-family: 'Courier New', monospace;
}

:deep(.el-select .el-input__inner) {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plate-container {
    padding: 10px;
  }

  .plate-input-wrapper {
    padding: 5px;
    gap: 3px;
  }

  .quick-input {
    gap: 5px;
  }

  .quick-char-btn {
    min-width: 30px;
    padding: 4px 8px;
  }

  .full-plate-display {
    padding: 10px;
    margin-top: 10px;
  }

  .separator {
    margin: 0 3px;
  }
}
</style>