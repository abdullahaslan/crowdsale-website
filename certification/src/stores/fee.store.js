import { action, computed, observable } from 'mobx';
import { phraseToWallet } from '@parity/ethkey.js';
import { randomPhrase } from '@parity/wordlist';

import backend from '../backend';
import blockStore from './block.store';

export const STEPS = {
  'waiting-payment': Symbol('waiting for payment'),
  'account-selection': Symbol('account selection'),
  'from-exchange': Symbol('from an exchange')
};

class FeeStore {
  @observable account = null;
  @observable fee = null;
  @observable step = STEPS['account-selection'];
  @observable wallet = null;
  @observable who = '';

  constructor () {
    this.load();
  }

  async createWallet () {
    const phrase = randomPhrase(12);
    const { address, secret } = await phraseToWallet(phrase);

    return { address, secret, phrase };
  }

  async fetchAccountInfo () {
    const { address } = this.wallet;
    const { incomingTxAddr, balance, paid } = await backend.getAccountFeeInfo(address);

    if (this.account === null || !this.account.balance.eq(balance)) {
      this.setAccount({ incomingTxAddr, balance, paid });
    }

    if (balance.gte(this.fee)) {
      this.unwatch();
      this.goto('account-selection');
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

  @action setAccount (account) {
    this.account = account;
  }

  @action setFee (fee) {
    this.fee = fee;
  }

  @action setWallet ({ address, secret, phrase }) {
    this.wallet = { address, secret, phrase };
  }

  @action setWho (who) {
    this.who = who;
  }

  @computed get valid () {
    const { who } = this;

    return who.length === 42 && /^0x[0-9a-g]{40}$/.test(who);
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
