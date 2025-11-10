<template>
  <div>
    <h2>车位预定</h2>
    <!-- 预定表单 -->
    <div class="reservation-form">
      <h3>创建新预定</h3>
      <form @submit.prevent="createReservation">
        <div>
          <label for="parking_space_id">车位ID:</label>
          <input type="number" v-model.number="newReservation.parking_space_id" required>
        </div>
        <div>
          <label for="start_time">开始时间:</label>
          <input type="datetime-local" v-model="newReservation.start_time" required>
        </div>
        <div>
          <label for="end_time">结束时间:</label>
          <input type="datetime-local" v-model="newReservation.end_time" required>
        </div>
        <button type="submit">创建预定</button>
      </form>
    </div>

    <!-- 用户预定列表 -->
    <div class="reservations-list">
      <h3>我的预定</h3>
      <ul>
        <li v-for="reservation in userReservations" :key="reservation.id">
          <p><strong>预定ID:</strong> {{ reservation.id }}</p>
          <p><strong>车位ID:</strong> {{ reservation.parking_space_id }}</p>
          <p><strong>开始时间:</strong> {{ new Date(reservation.start_time).toLocaleString() }}</p>
          <p><strong>结束时间:</strong> {{ new Date(reservation.end_time).toLocaleString() }}</p>
          <p><strong>状态:</strong> {{ reservation.status }}</p>
          <button v-if="reservation.status === 'active'" @click="cancelReservation(reservation.id)">取消预定</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';

const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  withCredentials: true,
});

const newReservation = ref({
  parking_space_id: null,
  start_time: '',
  end_time: '',
});

const userReservations = ref([]);

const createReservation = async () => {
  try {
    const response = await api.post('/reservations/', {
      ...newReservation.value,
      start_time: new Date(newReservation.value.start_time).toISOString(),
      end_time: new Date(newReservation.value.end_time).toISOString(),
    });
    userReservations.value.push(response.data);
    alert('预定成功！');
  } catch (error) {
    console.error('创建预定失败:', error);
    alert('创建预定失败，请稍后再试。');
  }
};

const fetchUserReservations = async () => {
  try {
    const response = await api.get('/reservations/');
    userReservations.value = response.data;
  } catch (error) {
    console.error('获取预定列表失败:', error);
  }
};

const cancelReservation = async (reservationId) => {
  try {
    const response = await api.put(`/reservations/${reservationId}/cancel`);
    const index = userReservations.value.findIndex(r => r.id === reservationId);
    if (index !== -1) {
      userReservations.value[index] = response.data;
    }
    alert('预定已取消！');
  } catch (error) {
    console.error('取消预定失败:', error);
    alert('取消预定失败，请稍后再试。');
  }
};

onMounted(() => {
  fetchUserReservations();
});
</script>

<style scoped>
.reservation-form, .reservations-list {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

form div {
  margin-bottom: 10px;
}

label {
  margin-right: 10px;
}

button {
  margin-top: 10px;
}

li {
  list-style-type: none;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
</style>