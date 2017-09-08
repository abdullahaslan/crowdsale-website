import BigNumber from 'bignumber.js';
import EthereumTx from 'ethereumjs-tx';
import { action, computed, observable } from 'mobx';
import { phraseToWallet } from '@parity/ethkey.js';
import { randomPhrase } from '@parity/wordlist';
import store from 'store';

import backend from '../backend';
import appStore from './app.store';
import blockStore from './block.store';

const FEE_REGISTRAR_ADDRESS = '0xa18376621ed621e22de44679f715bfdd15c9b6f9';
// Gas Limit of 100k gas
const FEE_REGISTRAR_GAS_LIMIT = new BigNumber('0x186a0');
// Gas Price of 5Gwei
const FEE_REGISTRAR_GAS_PRICE = new BigNumber('0x12a05f200');
// Signature of `pay(address)`
const FEE_REGISTRAR_PAY_SIGNATURE = '0x0c11dedd'

const FEE_HOLDER_LS_KEY = '_parity-certifier::fee-holder';

export const STEPS = {
  'waiting-payment': Symbol('waiting for payment'),
  'account-selection': Symbol('account selection'),
  'from-exchange': Symbol('from an exchange'),
  'from-personal': Symbol('from a personal wallet'),
  'sending-payment': Symbol('sending-payment')
};

class FeeStore {
  @observable account = null;
  @observable fee = null;
  @observable step = STEPS['waiting-payment'];
  @observable wallet = null;
  @observable who = '';

  constructor () {
    this.load();
  }

  async createWallet () {
    const storedPhrase = store.get(FEE_HOLDER_LS_KEY);
    const phrase = storedPhrase || randomPhrase(12);

    if (!storedPhrase) {
      store.set(FEE_HOLDER_LS_KEY, phrase);
    }

    const { address, secret } = await phraseToWallet(phrase);

    return { address, secret, phrase };
  }

  async fetchAccountInfo () {
    const { address } = this.wallet;
    const { incomingTxAddr, balance, paid } = await backend.getAccountFeeInfo(address);

    if (this.account === null || !this.account.balance.eq(balance) || paid !== this.account.paid) {
      this.setAccount({ incomingTxAddr, balance, paid });
    }

    if (this.step === STEPS['waiting-payment']) {
      if (balance.gte(this.fee) || paid) {
        this.unwatch();
        this.goto('account-selection');
      }
    }

    if (paid && this.step === STEPS['sending-payment']) {
      this.unwatch();
      appStore.goto('certify');
    }
  }

  @action goto (step) {
    if (!STEPS[step]) {
      throw new Error(`unkown step ${step}`);
    }

    this.step = STEPS[step];
  }

  async load () {
    try {
      const fee = await backend.fee();
      const wallet = await this.createWallet();

      this.setFee(fee);
      this.setWallet(wallet);

      await this.fetchAccountInfo();
      this.watch();
    } catch (error) {
      console.error(error);
    }
  }

  async sendPayment () {
    if (!this.valid) {
      return;
    }

    const { who } = this;

    console.warn('sending tx for', who);
    this.goto('sending-payment');

    try {
      const { address, secret } = this.wallet;
      const privateKey = Buffer.from(secret.slice(2), 'hex');

      const nonce = await backend.nonce(address);
      const calldata = FEE_REGISTRAR_PAY_SIGNATURE + who.slice(-40).padStart(64, 0);

      const tx = new EthereumTx({
        to: FEE_REGISTRAR_ADDRESS,
        gasLimit: '0x' + FEE_REGISTRAR_GAS_LIMIT.toString(16),
        gasPrice: '0x' + FEE_REGISTRAR_GAS_PRICE.toString(16),
        data: calldata,
        value: '0x' + this.contractFee.toString(16),
        nonce
      });

      tx.sign(privateKey);

      const serializedTx = `0x${tx.serialize().toString('hex')}`;
      const { hash } = await backend.sendFeeTx(serializedTx);

      console.warn('sent tx', hash);
      this.watch();
    } catch (error) {
      console.error(error);
    }
  }

  @action setAccount (account) {
    this.account = account;
  }

  @action setFee (fee) {
    this.contractFee = fee;
    this.fee = fee.plus(FEE_REGISTRAR_GAS_LIMIT.mul(FEE_REGISTRAR_GAS_PRICE));
  }

  @action setWallet ({ address, secret, phrase }) {
    this.wallet = { address, secret, phrase };
  }

  @action setWho (who) {
    this.who = who;
  }

  @computed get valid () {
    const { who } = this;

    return who.length === 42 && /^0x[0-9a-g]{40}$/i.test(who);
  }

  watch () {
    this.unwatch();
    blockStore.on('block', this.fetchAccountInfo, this);
  }

  unwatch () {
    blockStore.removeListener('block', this.fetchAccountInfo, this);
  }
}

export default new FeeStore();
