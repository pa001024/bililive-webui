<script setup lang="ts">
import { ref } from "vue";
import { IQueueRequest } from "..";

const requests = ref<IQueueRequest[]>([]);
const queueEnable = ref(true);
const freeEnable = ref(false);
const debugEnable = ref(false);

const text = ref<string>("");
const text2 = ref<string>("");
const alertText = ref<string>("");
const editID = ref<string>("");
let ws: WebSocket;

const onMsg = (msg: any) => {
  const data = JSON.parse(msg.data);
  switch (data.code) {
    case 0: {
      requests.value = data.requests;
      queueEnable.value = data.queueEnable;
      freeEnable.value = data.freeEnable;
      debugEnable.value = data.debug;
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

function sendMsg<T extends { action: string }>(data: T) {
  if (ws) {
    ws.send(JSON.stringify(data));
  }
}

function delReq(id: string) {
  sendMsg({ action: "delReq", id });
}

function sendText() {
  sendMsg({ action: "sendText", text: text.value });
  text.value = "";
}

function sendReq() {
  sendMsg({ action: "sendReq", text: text2.value });
  text2.value = "";
}

function switchQueueEnable() {
  sendMsg({
    action: "switchQueueEnable",
    queueEnable: queueEnable.value,
  });
}

function switchFreeEnable() {
  sendMsg({
    action: "switchFreeEnable",
    freeEnable: freeEnable.value,
  });
}

function switchDebugEnable() {
  sendMsg({
    action: "switchDebugEnable",
    debugEnable: debugEnable.value,
  });
}

function setReq(id: string) {
  sendMsg({ action: "setReq", id });
}

function editReq(req: IQueueRequest) {
  sendMsg({ action: "editReq", req });
  editID.value = "";
}

function topReq(id: string) {
  sendMsg({ action: "topReq", id });
}

function sendAlert() {
  sendMsg({ action: "sendAlert", text: alertText.value });
}

function edit(id: string) {
  editID.value = id;
}
</script>

<template>
  <div class="main-container">
    <div class="switch">
      <label>
        <input
          type="checkbox"
          v-model="queueEnable"
          name="queueEnable"
          @change="switchQueueEnable"
        />
        排队
      </label>
      <label>
        <input
          type="checkbox"
          v-model="debugEnable"
          name="debugEnable"
          @change="switchDebugEnable"
        />
        调试
      </label>
      <label>
        <input
          type="checkbox"
          v-model="freeEnable"
          name="freeEnable"
          @change="switchFreeEnable"
        />
        免费
      </label>
    </div>
    <div class="msg ctl">
      <input
        type="text"
        v-model="text"
        @keydown="(e) => e.key === 'Enter' && sendText()"
      />
      <button @click="sendText" style="margin-left: 4px">send</button>
    </div>
    <div class="queuectl ctl">
      <input type="text" v-model="text2" />
      <button @click="sendReq" style="margin-left: 4px">req</button>
    </div>
    <div class="alertctl ctl">
      <input type="text" v-model="alertText" />
      <button @click="sendAlert" style="margin-left: 4px">alert</button>
    </div>
    <div class="queue">
      <div class="header">当前队列 ({{ requests.length }}/4)</div>
      <transition-group name="list">
        <div v-for="req in requests" :req="req" :key="req.id">
          {{ req.uname }}
          <input
            style="width: 80px"
            v-if="editID === req.id"
            type="text"
            name="edittype"
            v-model="req.type"
            @blur="editReq(req)"
            autofocus
          />
          <span v-else @click="edit(req.id)">{{ req.type }}</span>
          <button class="option" @click="delReq(req.id)">X</button>
          <button class="option" @click="setReq(req.id)">√</button>
          <button class="option" @click="topReq(req.id)">↑</button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style lang="less" scoped>
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
.messages {
  margin: 20px 0;
}
.option {
  margin: 5px 0 0 5px;
}
.ctl {
  margin-bottom: 4px;
}
</style>
