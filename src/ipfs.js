const IPFS = require("ipfs-http-client");
const ipfs = IPFS.create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});
export default ipfs;
