<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from "vue";
import { IMessage, IQueueRequest } from "..";
import Message from "../components/Message.vue";
import Queue from "../components/Queue.vue";

const msgs = ref<IMessage[]>([]);
const requests = ref<IQueueRequest[]>([]);
const activeReq = ref("");
const queueEnable = ref<boolean>(true);
const freeEnable = ref<boolean>(false);

let alertContent = ref("");
let alertShow = ref(false);
let alertShowTime = ref(0);
let ws: WebSocket;
const MAX_TIME = 60e3;

const onMsg = (msg: any) => {
  const data = JSON.parse(msg.data);
  switch (data.code) {
    // sync
    case 0: {
      queueEnable.value = data.queueEnable;
      freeEnable.value = data.freeEnable;
      if (data.msgs) msgs.value = data.msgs;
      if (data.requests) requests.value = data.requests;
      if (data.activeReq) activeReq.value = data.activeReq;
      const now = Date.now();
      if (msgs.value.length && now - msgs.value[0].t >= MAX_TIME) {
        msgs.value = msgs.value.filter(v => now - v.t < MAX_TIME);
      }
      break;
    }
    case 1: {
      // msg
      const { id, uid, text, uname } = data.data;
      msgs.value.push({
        id,
        uid,
        uname,
        text,
        t: Date.now(),
      });
      break;
    }
    case 2: {
      // req
      const { id, type, uid, uname, t } = data.data;
      requests.value.push({
        id,
        type,
        uid,
        uname,
        t,
      });
      break;
    }
    case 4: {
      // setReq
      const { id } = data.data;
      activeReq.value = id;
      const req = requests.value.find(v => v.id === id);
      if (!req) return;
      alertContent.value = `${req.uname}，轮到你了，请在一分钟内扫码~`;
      alertShow.value = true;
      alertShowTime.value = Date.now() + 60e3;
    }
  }
};
let heartbeat: any = null;
let lockReconnect = false;
const reconnect = () => {
  if (lockReconnect) return;
  lockReconnect = true;
  ws = new WebSocket("ws://localhost:3334/ws");
  ws.addEventListener("message", onMsg);
  ws.onclose = reconnect;
  if (heartbeat) clearTimeout(heartbeat);
  heartbeat = setInterval(() => {
    ws.send(JSON.stringify({ code: 9 }));
  }, 5e3);
  lockReconnect = false;
};

reconnect();

setInterval(() => {
  // 去除过期msg
  const now = Date.now();
  if (msgs.value.length && now - msgs.value[0].t >= MAX_TIME) {
    msgs.value = msgs.value.filter(v => now - v.t < MAX_TIME);
  }
}, 1e3);

// tip
const tips = (function* () {
  const list = [
    "关注深渊免费一层 B坷垃插队全通~",
    "看号配队免费~",
    "粉丝群111584581~",
    "iOS充值或者上舰请通过公众号呀~",
    "每晚随缘直播 点关注 不迷路~",
    "新增B坷垃插队功能 赠送B坷垃自动插队里~~",
    "QwQ想做个任务 送个'牛哇牛哇'呀~",
  ];
  while (1) {
    for (const item of list) yield item;
  }
})();
let tipContent = ref("");
let tipShow = ref(false);

function delay(t = 1) {
  return new Promise(resolve => setTimeout(resolve, t * 1e3));
}
setInterval(async () => {
  tipShow.value = true;
  tipContent.value = tips.next().value!;
  await delay(10);
  tipShow.value = false;
}, 20e3);
setInterval(() => {
  if (alertShowTime.value < Date.now()) alertShow.value = false;
}, 1e3);
</script>

<template>
  <div class="main-container">
    <div class="queue">
      <div class="header" v-if="requests.length">当前队列 ({{ requests.length }}/4)</div>
      <div class="header" v-else-if="queueEnable">当前队列为空 {{ freeEnable ? "(免费)" : "(礼物)" }}</div>
      <div class="header" v-else>当前未开启排队</div>

      <transition-group name="fade">
        <Queue v-for="req in requests.slice(0, 4)" :req="req" :key="req.id" :active="req.id === activeReq" />
      </transition-group>
    </div>
    <div class="padding"></div>
    <div class="messages">
      <transition-group name="list">
        <Message v-for="msg in msgs" :msg="msg" :key="msg.id" />
      </transition-group>
    </div>
    <transition name="fade">
      <div class="tips" v-if="tipShow">{{ tipContent }}</div>
    </transition>
    <transition name="fade">
      <div class="alert" v-if="alertShow">{{ alertContent }}</div>
    </transition>
  </div>
</template>

<style lang="less" scoped>
.tips {
  position: absolute;
  right: 328px;
  bottom: 344px;
  @bgcolor: #3d4557;
  @fgcolor: #fff;
  font-size: 24px;
  color: @fgcolor;
  background: @bgcolor;
  padding: 12px 20px;
  border-radius: 50px;
  margin-left: 14px;
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  &::before {
    position: absolute;
    right: -18px;
    bottom: 1px;
    content: "";
    width: 0;
    height: 0;
    border: 10px solid transparent;
    border-left-width: 14px;
    border-left-color: #3d4557;
    transform: rotate(23deg);
  }
}

.main-container {
  padding: 0;
  font-family: "HYWenHei 85W";
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.padding {
  flex: 1;
}

.queue {
  display: flex;
  height: 66px;
  margin-top: 22px;
  margin-left: 460px;
  align-items: center;
  .header {
    color: #fff;
    font-size: 24px;
    text-shadow: 1px 1px 2px #000;
    padding: 8px 20px;
    display: inline-block;
    border-radius: 50px;
    line-height: 50px;
  }
}

.alert {
  margin: 0 auto;
  top: 20%;
  position: fixed;
  text-align: center;
  font-size: 64px;
  font-family: "HYWenHei 85W";
  color: #fff;
  text-shadow: 1px 1px 3px #0000002c;
  align-self: center;
}

.messages {
  margin: 20px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.list-enter-active,
.list-leave-active {
  transition: all 1s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-120px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
.list-move {
  transition: all 1s ease;
}
.list-leave-active {
  position: absolute;
}
</style>
