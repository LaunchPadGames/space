module.exports = async function () {
  const AgonesSDK = require('@google-cloud/agones-sdk');
  let agonesSDK = new AgonesSDK();
  await agonesSDK.connect();

  let result = await agonesSDK.ready();

  agonesSDK.watchGameServer((result) => {
    console.log('watch', result);
  }, (error) => {
    console.error('error', error);
  });
}