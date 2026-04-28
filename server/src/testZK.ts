import ZKLib from 'node-zklib';

async function testZK() {
  const zk = new ZKLib('192.168.8.200', 4370, 10000, 4000);
  try {
    console.log("Connecting...");
    await zk.createSocket();
    console.log("Connected! Fetching logs...");
    const logs = await zk.getAttendances();
    console.log("Total logs fetched:", logs.data.length);
    
    // Sort and show the last 5 logs
    const sorted = logs.data.sort((a: any, b: any) => new Date(a.recordTime).getTime() - new Date(b.recordTime).getTime());
    console.log("Last 5 logs in machine:", sorted.slice(-5));

    await zk.disconnect();
  } catch (err) {
    console.error("ZK Error:", err);
  }
}
testZK();
