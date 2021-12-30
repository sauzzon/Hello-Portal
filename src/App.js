import React, { useEffect, useState } from "react";
import "./App.css";
import ipfs from "./ipfs";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const [waveCount, setWaveCount] = useState(0);
  const [message, setMessage] = useState("");
  const [ipfs_Hash, setIpfsHash] = useState("");
  const [buffer, setBuffer] = useState("");
  var file = "";

  //   /** @dev Take file input from user */
  const captureFile = (event) => {
    event.stopPropagation(); // stop react bubbling up click event
    event.preventDefault(); // stop react refreshing the browser
    file = event.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => convertToBuffer(reader);
  };

  //     /** @dev Convert the file to buffer to store on IPFS */
  const convertToBuffer = async (reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer as state variable, using React hook function
    setBuffer(buffer);
  };

  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x9782989876200AE069064F601128Aafed288A293";
  const contractABI = abi.abi;

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            ipfsHash: wave.ipfsHash,
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
        console.log(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setWaveCount(count.toNumber());

        //ipfs-functionality
        const ipfsHash = await ipfs.add(buffer);
        console.log("ipfsHash after ipfs.add:", ipfsHash.path);
        setIpfsHash(ipfsHash.path);
        /*
         * Execute the actual wave from your smart contract
         */

        console.log(ipfsHash, message, "and", ipfsHash.path);
        const waveTxn = await wavePortalContract.wave(message, ipfsHash.path, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setWaveCount(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    checkIfWalletIsConnected();

    let wavePortalContract;

    const onNewWave = (from, timestamp, message, ipfsHash) => {
      console.log("NewWave", from, timestamp, message, ipfsHash);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          ipfsHash: ipfsHash,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const getViewButton = (hash) => {
    if (hash == "") {
      return false;
    }
    return true;
  };

  const getDocumentLink = (hash) => {
    let url = "https://gateway.ipfs.io/ipfs/";
    url = url + hash;
    return url;
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div style={{ color: "red" }} className="header">
          👋 Hello there!
        </div>

        <div style={{ color: "blue" }} className="bio">
          I am Saujan Tiwari and I am learning Web3 !!! Connect your Ethereum
          wallet and send me a message by waving at me!
        </div>

        <div style={{ margin: 20 }}>
          <input
            style={{ height: 50, width: 500, fontSize: 20, color: "green" }}
            placeholder="Enter Message to send me"
            type="text"
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></input>
        </div>

        <div
          style={{
            color: "red",
            background: "OldLace",
            padding: "10px 20px",
          }}
        >
          <label
            style={{
              display: "inline-block",
              padding: "6px 12px",
              cursor: "pointer",
            }}
            for="upload"
          >
            Upload image:
          </label>
          <input size="60" type="file" id="upload" onChange={captureFile} />
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div style={{ color: "red" }}>Address: {wave.address}</div>
              <div style={{ color: "green" }}>
                Time: {wave.timestamp.toString()}
              </div>
              <div style={{ color: "blue" }}>Message: {wave.message}</div>

              {getViewButton(wave.ipfsHash) ? (
                <>
                  <a href={getDocumentLink(wave.ipfsHash)} target="_blank">
                    <button className="waveButton">
                      Click to view document
                    </button>
                  </a>
                </>
              ) : (
                <></>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
