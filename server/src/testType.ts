import ZKLib from 'node-zklib';

async function testZK() {
  const zk = new ZKLib('192.168.8.200', 4370, 10000, 4000);
  try {
    await zk.createSocket();
    const logs = await zk.getAttendances();
    const lastLog = logs.data[logs.data.length - 1];
    console.log("recordTime type:", typeof lastLog.recordTime);console.log("recordTime value:", lastLog.recordTime);console.log("new Date():", new Date(lastLog.recordTime));
    await zk.disconnect();
  } catch (err) {
    console.error("ZK Error:", err);
  }
}
testZK();
