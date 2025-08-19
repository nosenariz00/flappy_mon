// wallet.js — Monad Testnet (EVM-like) integration

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { createAppKit } from "https://cdn.jsdelivr.net/npm/@reown/appkit@1.7.19/+esm";
import { sepolia } from "https://cdn.jsdelivr.net/npm/@reown/appkit@1.7.19/networks/+esm";
import { walletConnect } from "https://cdn.jsdelivr.net/npm/@reown/appkit-adapter-wagmi@1.7.19/+esm";

const connectWalletBtn = document.getElementById('connectWalletBtn');
const mintBtn = document.getElementById('mintBtn');
const walletDisplay = document.getElementById('wallet-display');

let provider;
let signer;
let contract;
let currentAccount = null;

// Datos del contrato
const CONTRACT_ADDRESS = "0x11ddb63052d2ad69d15c7879890104eccccff3be";
const CONTRACT_ABI = [
  "function mint() public",
  "function balanceOf(address owner) view returns (uint256)"
];

// Solo parámetros de red para AppKit
const projectId = "c417e04bf02de050bec4b0ffaf5ff60d"; // pon tu projectId real
const appKit = createAppKit({
  adapters: [
    walletConnect({ projectId })
  ],
  networks: [sepolia],
  metadata: {
    name: "Flappy Mon",
    description: "Juego Flappy Mon con wallet",
    url: window.location.origin,
    icons: ["https://walletconnect.com/walletconnect-logo.png"],
  },
});

mintBtn.disabled = true;

function showStatusMessage(message, type = 'info', link = null) {
  let container = document.querySelector('.status-message-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'status-message-container';
    document.body.appendChild(container);
  }
  const statusEl = document.createElement('div');
  statusEl.className = `status-message status-${type}`;
  statusEl.innerHTML = message;
  if (link) {
    statusEl.style.cursor = "pointer";
    statusEl.onclick = () => window.open(link, "_blank");
  }
  container.insertBefore(statusEl, container.firstChild);
  setTimeout(() => {
    statusEl?.remove();
    if (container.childElementCount === 0) {
      container.remove();
    }
  }, 3000);
}

// Nueva función para conectar wallet usando AppKit
async function connectWallet() {
  try {
    const session = await appKit.connect();
    currentAccount = session.accounts[0].address;
    walletDisplay.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    walletDisplay.title = currentAccount;
    walletDisplay.classList.remove('hidden');
    walletDisplay.setAttribute('data-tooltip', 'Desconectar wallet');
    provider = new ethers.providers.Web3Provider(session.provider);
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    mintBtn.disabled = false;
    document.getElementById('controls').classList.remove('hidden');
    connectWalletBtn.classList.add('hidden');
    showStatusMessage("Wallet conectada correctamente.", "info");
  } catch (err) {
    console.error(err);
    showStatusMessage("Error conectando wallet: " + err.message, "error");
  }
}

export function disconnectWallet() {
  currentAccount = null;
  provider = null;
  signer = null;
  contract = null;
  mintBtn.disabled = true;
  document.getElementById('controls').classList.add('hidden');
  walletDisplay.classList.add('hidden');
  walletDisplay.textContent = '';
  walletDisplay.removeAttribute('title');
  walletDisplay.removeAttribute('data-tooltip');
  connectWalletBtn.classList.remove('hidden');
  showStatusMessage("Wallet desconectada", "info");
  // Siempre salir al lobby y ocultar el juego
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('lobby').classList.remove('hidden');
  document.body.classList.remove('game-active');
  // Detener el juego y limpiar canvas (igual que botón salir)
  if (window.p5 && window.p5.instance) {
    try { window.p5.instance.remove(); } catch (e) {}
  }
  const flappyContainer = document.getElementById('flappyContainer');
  if (flappyContainer) {
    const canvases = flappyContainer.getElementsByTagName('canvas');
    while (canvases.length > 0) {
      canvases[0].remove();
    }
  }
}

export function getCurrentAccount() {
  return currentAccount;
}

export { contract };

// ✅ Nuevo: exportar signer para que game.js pueda usarlo
export function getSigner() {
  return signer;
}

async function mintNFT() {
  if (!contract) {
    showStatusMessage("Primero conecta tu wallet.", "error");
    return;
  }
  try {
    const tx = await contract.mint();
    await tx.wait();
    const explorerUrl = `https://testnet.monadexplorer.com/tx/${tx.hash}`;
    showStatusMessage(
      `NFT minteado.<br><span style="font-size:0.95em;">Ver en explorer</span>`,
      "info",
      explorerUrl
    );
  } catch (err) {
    console.error(err);
    let explorerUrl = null;
    if (err?.transaction?.hash) {
      explorerUrl = `https://testnet.monadexplorer.com/tx/${err.transaction.hash}`;
    }
    if (err.code === 'ACTION_REJECTED') {
      showStatusMessage(
        `Mint cancelado por el usuario.<br>${explorerUrl ? '<span style="font-size:0.95em;">Ver en explorer</span>' : ''}`,
        "error",
        explorerUrl
      );
    } else {
      showStatusMessage(
        `Error al mintear: ${err.message}<br>${explorerUrl ? '<span style="font-size:0.95em;">Ver en explorer</span>' : ''}`,
        "error",
        explorerUrl
      );
    }
  }
}

connectWalletBtn.addEventListener('click', connectWallet);
mintBtn.addEventListener('click', mintNFT);

document.addEventListener('DOMContentLoaded', () => {
  connectWalletBtn?.addEventListener('click', connectWallet);
  document.getElementById('controls').classList.add('hidden');
  walletDisplay.classList.add('hidden');
  walletDisplay.textContent = '';
  walletDisplay.removeAttribute('title');
  walletDisplay.removeAttribute('data-tooltip');
});

walletDisplay.addEventListener('mouseenter', () => {
  walletDisplay.setAttribute('data-tooltip', 'Desconectar wallet');
});
walletDisplay.addEventListener('click', () => {
  disconnectWallet();
});
  walletDisplay.classList.add('hidden');
  walletDisplay.textContent = '';
  walletDisplay.removeAttribute('title');
  walletDisplay.removeAttribute('data-tooltip');
  walletDisplay.removeAttribute('data-tooltip');
