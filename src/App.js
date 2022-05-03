import { ethers } from "ethers";
import React, { useEffect, useState, useCallback } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import myEpicNft from "./utils/MyEpicNFT.json";
import { gsap } from 'gsap'
import { CustomEase } from 'gsap/dist/CustomEase'
import { SplitText } from 'gsap/dist/SplitText'
// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "yukqi_crypto";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 5;
const CONTRACT_ADDRESS =
    "0xA4759Ed094e20DC760a92f1680d774e14504bF7a";
const App = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [mintState, setMintState] = useState("");
  const [mintCount, setMintCount] = useState("0");
  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);
  /*
   * ユーザーが認証可能なウォレットアドレスを持っているか確認します。
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    /*
		// ユーザーが認証可能なウォレットアドレスを持っている場合は、
    // ユーザーに対してウォレットへのアクセス許可を求める。
    // 許可されれば、ユーザーの最初のウォレットアドレスを
    // accounts に格納する。
    */

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      // **** イベントリスナーをここで設定 ****
      // この時点で、ユーザーはウォレット接続が済んでいます。
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * connectWallet メソッドを実装します。
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      // 0x4 は　Rinkeby の ID です。
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
      // **** イベントリスナーをここで設定 ****
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFT が発行されます。
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `あなたのウォレットに NFT を送信しました。OpenSea に表示されるまで最大で10分かかることがあります。NFT へのリンクはこちらです: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });
        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const mineRef = useCallback(async (node) => {
    if (node !== null) {
      gsap.registerPlugin(SplitText, CustomEase)
      CustomEase.create(
        'custom',
        'M0,0 C0.128,0.572 0.444,1.445 0.71,1.446 0.766,1.446 1,1.194 1,1 '
      )
      const move = node.getElementsByTagName('span')
      const enSplit = new SplitText(move, { type: 'words, chars' })
      gsap.from(enSplit.chars, {
        repeat: -1,
        duration: 0.5,
        y: 10,
        scaleY: 0.7,
        opacity: 0,
        stagger: 0.05,
        ease: 'custom'
      })
    }
  })

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        setMintState(<p><span>Going to pop wallet</span> now to pay gas...</p>);
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Mining...please wait.");
        setMintState(<p ref={mineRef}><span>Mining...</span>please wait.</p>);
        await nftTxn.wait();
  
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setMintState(<p>Mined, see transaction: <a href="https://rinkeby.etherscan.io/tx/{nftTxn.hash}" target="_blank" rel="noreferrer">https://rinkeby.etherscan.io/tx/{nftTxn.hash}</a></p>)
        getTokenIdsMinted();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const getTokenIdsMinted = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          provider
        );
        const tokenIds = await connectedContract.tokenIds();
        console.log(`tokenIds: ${tokenIds}`);
        setMintCount(tokenIds.toString());
      }
    } catch (error) {
      console.log(error);
    }
  }
  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    getTokenIdsMinted();
  }, []);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          <p className="sub-text"><a href={`https://rinkeby.rarible.com/collection/${CONTRACT_ADDRESS}/items`} target="_blank" rel="noreferrer">Rarible でコレクションを表示</a></p>
          <p className="sub-text">{mintCount}/10のNFTがミントされています</p>
          {/*条件付きレンダリングを追加しました
          // すでに接続されている場合は、
          // Connect to Walletを表示しないようにします。*/}
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : Number(mintCount) < 10 ? (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
              Mint NFT
            </button>
          ) : (<p className="sub-text">NFTは全てmintされました。</p>)}
        </div>
        <div className="sub-text">{mintState}</div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};
export default App;